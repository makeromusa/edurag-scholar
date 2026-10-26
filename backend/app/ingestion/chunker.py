from typing import List, Dict, Any
from app.ingestion.extractor import ExtractedPage


class DocumentChunk:
    def __init__(
        self,
        unit_code: str,
        document_id: str,
        page_number: int,
        slide_title: str,
        content: str,
        metadata: Dict[str, Any]
    ):
        self.unit_code = unit_code
        self.document_id = document_id
        self.page_number = page_number
        self.slide_title = slide_title
        self.content = content
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        return {
            "unit_code": self.unit_code,
            "document_id": self.document_id,
            "page_number": self.page_number,
            "slide_title": self.slide_title,
            "content": self.content,
            "metadata": self.metadata
        }


def chunk_extracted_pages(
    pages: List[ExtractedPage],
    unit_code: str,
    document_id: str,
    max_chunk_chars: int = 2000,
    overlap_chars: int = 250
) -> List[DocumentChunk]:
    """
    Slide-aware chunker.
    Keeps each slide/page intact if under max_chunk_chars.
    If a slide is unusually large, splits it into overlapping windows.
    """
    chunks: List[DocumentChunk] = []

    for page in pages:
        content = page.content.strip()
        if not content:
            continue

        title = page.title or f"Slide {page.page_number}"
        meta = page.metadata.copy()
        meta.update({
            "unit_code": unit_code,
            "document_id": document_id,
            "page_number": page.page_number,
            "slide_title": title
        })

        if len(content) <= max_chunk_chars:
            chunks.append(DocumentChunk(
                unit_code=unit_code,
                document_id=document_id,
                page_number=page.page_number,
                slide_title=title,
                content=content,
                metadata=meta
            ))
        else:
            # Overlapping window chunking for long slides or text docs
            start = 0
            sub_index = 1
            while start < len(content):
                end = min(start + max_chunk_chars, len(content))
                chunk_slice = content[start:end].strip()
                
                if chunk_slice:
                    slice_meta = meta.copy()
                    slice_meta["sub_chunk"] = sub_index

                    chunks.append(DocumentChunk(
                        unit_code=unit_code,
                        document_id=document_id,
                        page_number=page.page_number,
                        slide_title=f"{title} (Part {sub_index})",
                        content=chunk_slice,
                        metadata=slice_meta
                    ))
                    sub_index += 1

                if end == len(content):
                    break
                start += max_chunk_chars - overlap_chars
                sub_index += 1

    return chunks
