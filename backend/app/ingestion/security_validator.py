import os
import re
import io
import zipfile
import logging
from typing import Tuple
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Allowed academic extensions
ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx"}

# Maximum allowed file size: 50 MB
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

# Signatures for known dangerous executable headers (prevent masquerading)
BLOCKED_SIGNATURES = [
    (b"MZ", "Windows PE / DOS Executable (.exe, .dll, .scr)"),
    (b"\x7fELF", "Linux ELF Executable binary"),
    (b"\xca\xfe\xba\xbe", "Java Class Bytecode / Mach-O binary"),
    (b"#!", "Shell script executable"),
    (b"<?php", "PHP script"),
    (b"<script", "HTML/JavaScript payload"),
]


def sanitize_filename(raw_filename: str) -> str:
    """
    Sanitizes an uploaded filename to prevent directory traversal, null-byte injection,
    and control-character attacks.
    """
    if not raw_filename:
        return "unnamed_document.pdf"

    # Remove null bytes and control chars
    clean_name = raw_filename.replace("\x00", "").replace("\u0000", "").strip()

    # Strip directory components (e.g. ../../etc/passwd -> passwd)
    clean_name = os.path.basename(clean_name)
    clean_name = clean_name.replace("/", "").replace("\\", "").replace("..", "")

    # Limit filename length
    name, ext = os.path.splitext(clean_name)
    if len(name) > 100:
        name = name[:100]
    clean_name = f"{name}{ext}"

    # Verify no double extensions that hide executables (e.g., paper.pdf.exe)
    ext_lower = ext.lower()
    if ext_lower not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Security rejection: Extension '{ext_lower}' is not permitted. Only .pdf, .pptx, and .docx are allowed."
        )

    return clean_name


def validate_file_security(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Validates uploaded file against size limits, magic bytes, and masquerading attacks.
    Returns (True, sanitized_filename) or raises HTTPException.
    """
    # 1. Size Validation
    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Security rejection: Uploaded file is empty (0 bytes).")
    
    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Security rejection: File size ({file_size // (1024 * 1024)} MB) exceeds maximum allowed {max_mb} MB."
        )

    # 2. Filename Sanitization
    safe_name = sanitize_filename(filename)
    ext = os.path.splitext(safe_name)[1].lower()

    # 3. Check for Blocked Executable Signatures
    header_16 = file_bytes[:16]
    for signature, desc in BLOCKED_SIGNATURES:
        if header_16.startswith(signature):
            logger.critical(f"Security Alert: Blocked upload disguised as '{safe_name}'. Detected signature: {desc}")
            raise HTTPException(
                status_code=400,
                detail=f"Security rejection: Malicious file signature detected. Blocked: {desc}."
            )

    # 4. Strict Magic Bytes Inspection per Extension
    if ext == ".pdf":
        # PDF Specification: '%PDF-' must occur within the first 1024 bytes
        header_sample = file_bytes[:1024]
        if b"%PDF-" not in header_sample:
            logger.warning(f"File '{safe_name}' has .pdf extension but lacks '%PDF-' magic bytes.")
            raise HTTPException(
                status_code=400,
                detail="Security rejection: Invalid PDF structure. Missing '%PDF-' magic byte signature."
            )

    elif ext in [".pptx", ".docx"]:
        # OOXML format: Must be a valid ZIP archive starting with PK\x03\x04
        if not file_bytes.startswith(b"PK\x03\x04"):
            logger.warning(f"File '{safe_name}' has '{ext}' extension but lacks ZIP magic bytes.")
            raise HTTPException(
                status_code=400,
                detail=f"Security rejection: Invalid Office document. Missing ZIP magic bytes for {ext}."
            )
        
        # Verify ZIP archive structure and test for zip bombs
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as zf:
                # Check for bad zip
                first_bad = zf.testzip()
                if first_bad:
                    raise HTTPException(status_code=400, detail=f"Corrupted Office document archive: {first_bad}")
                
                # Check uncompressed size to prevent zip bomb (decompression bomb attack)
                total_uncompressed = sum(info.file_size for info in zf.infolist())
                if total_uncompressed > 200 * 1024 * 1024:  # 200 MB uncompressed limit
                    raise HTTPException(
                        status_code=400,
                        detail="Security rejection: Decompression ratio too high (possible zip-bomb denial of service)."
                    )
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail=f"Corrupted or invalid {ext} archive.")

    return True, safe_name
