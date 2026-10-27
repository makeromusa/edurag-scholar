import os
import sys
import time
import socket
import functools
from pathlib import Path

# Force IPv4 to prevent Windows NAT64 [Errno 11001]
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

# Auto-flush all prints
print = functools.partial(print, flush=True)

# Add backend directory to path & load .env
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from app.core.database import get_supabase_admin_client
from app.ingestion.extractor import extract_document_pages
from app.ingestion.chunker import chunk_extracted_pages
from app.ingestion.embedder import embedding_service

USER_ID = "9bd58ed8-3c71-4b9a-be11-83813b71456f"
DOWNLOADS_DIR = Path(r"C:\Users\HomePC\Downloads")

# Exact mapping of valid notes to their respective UoN course units
NOTE_MAPPINGS = [
    # SCS 3203: Computer Architecture
    ("SCS 3203", "comp arch_merged slides.pdf"),
    ("SCS 3203", "SCS3203_Computer Architecture 2nd Year Course Outline 2024_2025.pdf"),

    # SCS 3207: Operating Systems
    ("SCS 3207", "Stallings, W. (2018). Operating Systems_ Internals and Design Principles (9th ed.). Pearson Education Limited..pdf"),

    # CSC 3211: Computer Networks
    ("CSC 3211", "Forouzan, B. A. (2007). Data communications and networking_ Fourth edition. McGraw-Hill Higher Education..pdf"),
    ("CSC 3211", "Stallings, W. (2006). Data and computer communications_ Eighth edition. Pearson Prentice Hall..pdf"),

    # SCS 3209: Software Engineering
    ("SCS 3209", "Sommerville, I. (2016). Software engineering (9th ed.)..pdf"),
    ("SCS 3209", "SE Course Outline2024.pdf"),
    ("SCS 3209", "L3 SCS 3209 Software Engineering.pdf"),
    ("SCS 3209", "Project Guidelines Revised Version 2024.pdf"),

    # SCS 3205: Knowledge-Based Systems & Programming
    ("SCS 3205", "SCS 3205 Course Outline.pdf"),

    # SCS 3201: Systems Analysis and Design
    ("SCS 3201", "Chap 7 Using Data Flow Diagrams.pdf"),
    ("SCS 3201", "Process Design.pdf"),
    ("SCS 3201", "SYSTEM ARCHITECTURE.pdf"),
    ("SCS 3201", "USE_CASE_MODELS_Final.pdf"),
    ("SCS 3201", "Task_7_Integrated_Final.pdf"),
    ("SCS 3201", "Task_9_DFD_Final_v3.pdf"),
    ("SCS 3201", "use case model uml.pdf"),

    # SMA 2114: Differential & Integral Calculus
    ("SMA 2114", "Angenent, S. B. (2009). MATH 221 - 1st Semester Calculus Lecture Notes, Version 2.0 (Fall 2009)..pdf"),
    ("SMA 2114", "Fox, H., & Bolton, W. (2002). Mathematics for Engineers and Technologists. Elsevier Science & Technology Books..pdf"),
]

def ingest_notes():
    client = get_supabase_admin_client()

    # 1. Fetch already existing documents for this user
    existing_res = client.table("documents").select("id, unit_code, title, is_processed").eq("uploaded_by", USER_ID).execute()
    existing_by_title = {d["title"]: d for d in existing_res.data}
    print(f"Found {len(existing_by_title)} existing documents for user {USER_ID}")

    total_files = len(NOTE_MAPPINGS)
    print(f"\nTarget notes to ingest: {total_files} files across 7 UoN Units\n" + "=" * 60)

    for idx, (unit_code, filename) in enumerate(NOTE_MAPPINGS, 1):
        file_path = DOWNLOADS_DIR / filename
        print(f"\n[{idx}/{total_files}] Processing [{unit_code}]: {filename}")

        if not file_path.exists():
            print(f"  [MISSING] File not found at {file_path}, skipping.")
            continue

        file_size = file_path.stat().st_size
        if file_size == 0:
            print(f"  [EMPTY] File size is 0 bytes, skipping.")
            continue

        if filename in existing_by_title and existing_by_title[filename].get("is_processed"):
            print(f"  [EXISTS] Already ingested and processed (Doc ID: {existing_by_title[filename]['id']}). Skipping.")
            continue

        try:
            start_t = time.time()
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            file_type = "pdf" if filename.endswith(".pdf") else "pptx" if filename.endswith(".pptx") else "docx"

            # Step A: Extract pages
            print(f"  -> Extracting pages ({file_size / (1024*1024):.2f} MB)...")
            extracted_pages = extract_document_pages(file_bytes, filename)
            if not extracted_pages:
                print(f"  [FAIL] No extractable text found in {filename}.")
                continue
            print(f"  -> Extracted {len(extracted_pages)} pages.")

            # Step B: Register or update document in Supabase
            doc_id = None
            if filename in existing_by_title:
                doc_id = existing_by_title[filename]["id"]
                client.table("documents").update({
                    "unit_code": unit_code,
                    "page_count": len(extracted_pages),
                    "file_size_bytes": len(file_bytes),
                    "is_processed": False
                }).eq("id", doc_id).execute()
                # Clean any previous chunks
                client.table("document_chunks").delete().eq("document_id", doc_id).execute()
            else:
                doc_payload = {
                    "unit_code": unit_code,
                    "title": filename,
                    "file_type": file_type,
                    "storage_url": f"local://{filename}",
                    "file_size_bytes": len(file_bytes),
                    "page_count": len(extracted_pages),
                    "uploaded_by": USER_ID,
                    "is_processed": False
                }
                res = client.table("documents").insert(doc_payload).execute()
                doc_id = res.data[0]["id"]

            # Step C: Chunking
            print(f"  -> Chunking {len(extracted_pages)} pages...")
            raw_chunks = chunk_extracted_pages(extracted_pages, unit_code=unit_code, document_id=doc_id)
            chunks = [c for c in raw_chunks if c.content and c.content.strip()]
            if not chunks:
                print(f"  [WARN] No valid text chunks produced.")
                continue
            print(f"  -> Generated {len(chunks)} chunks.")

            # Step D: Batch embeddings
            print(f"  -> Generating Gemini 1536-dim embeddings for {len(chunks)} chunks...")
            chunk_texts = [c.content for c in chunks]
            embeddings = embedding_service.get_embeddings_batch(chunk_texts, batch_size=40)

            records_to_insert = []
            for i, chunk in enumerate(chunks):
                emb = embeddings[i] if i < len(embeddings) else [0.0] * 1536
                if not emb or len(emb) != 1536:
                    emb = [0.0] * 1536
                clean_content = (chunk.content or "").replace("\x00", "").replace("\u0000", "")
                clean_title = (chunk.slide_title or "").replace("\x00", "").replace("\u0000", "") if chunk.slide_title else None
                records_to_insert.append({
                    "document_id": doc_id,
                    "unit_code": unit_code,
                    "page_number": chunk.page_number,
                    "slide_title": clean_title,
                    "content": clean_content,
                    "embedding": emb,
                    "metadata": chunk.metadata
                })

            # Step E: Insert chunks in batches of 250
            print(f"  -> Storing {len(records_to_insert)} chunks into Supabase pgvector...")
            batch_size = 250
            for b_idx in range(0, len(records_to_insert), batch_size):
                batch = records_to_insert[b_idx:b_idx+batch_size]
                client.table("document_chunks").insert(batch).execute()

            # Step F: Mark document processed
            client.table("documents").update({"is_processed": True}).eq("id", doc_id).execute()
            elapsed = time.time() - start_t
            print(f"  [SUCCESS] Ingested and indexed in {elapsed:.1f}s: {filename}")

        except Exception as e:
            print(f"  [ERROR] Error ingesting {filename}: {str(e)}")

    print("\n" + "=" * 60 + "\nAll specified notes processing completed!")

if __name__ == "__main__":
    ingest_notes()
