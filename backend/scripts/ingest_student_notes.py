import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import get_supabase_admin_client
from app.ingestion.extractor import extract_text_from_pdf
from app.ingestion.chunker import chunk_extracted_pages
from app.ingestion.embedder import embedding_service

USER_ID = "9bd58ed8-3c71-4b9a-be11-83813b71456f"
DOWNLOADS_DIR = r"C:\Users\HomePC\Downloads"

NOTES_TO_INGEST = [
    ("Chap 7 Using Data Flow Diagrams.pdf", "CSC 3211"),
    ("use case model uml.pdf", "CSC 3211"),
    ("Task_9_DFD_Final_v3.pdf", "CSC 3211"),
    ("Angenent, S. B. (2009). MATH 221 - 1st Semester Calculus Lecture Notes, Version 2.0 (Fall 2009)..pdf", "SMA 2114"),
]


def ingest_file(file_name: str, unit_code: str):
    file_path = os.path.join(DOWNLOADS_DIR, file_name)
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        print(f"Skipping {file_name}: not found or empty in Downloads.")
        return

    client = get_supabase_admin_client()

    # Check if already ingested for this unit
    existing = client.table("documents").select("id").eq("title", file_name).eq("unit_code", unit_code).execute()
    if existing.data:
        print(f"✓ {file_name} is already indexed in unit {unit_code}. Skipping.")
        return

    print(f"\nProcessing {file_name} for [{unit_code}]...")
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    pages = extract_text_from_pdf(file_bytes, file_name)
    print(f"  Extracted {len(pages)} pages.")

    doc_res = client.table("documents").insert({
        "unit_code": unit_code,
        "title": file_name,
        "file_type": "pdf",
        "storage_url": f"local://{file_name}",
        "file_size_bytes": len(file_bytes),
        "page_count": len(pages),
        "uploaded_by": USER_ID,
        "is_processed": False
    }).execute()

    doc_id = doc_res.data[0]["id"]
    chunks = chunk_extracted_pages(pages, unit_code=unit_code, document_id=doc_id)
    chunks = [c for c in chunks if c.content and c.content.strip()]
    print(f"  Generated {len(chunks)} chunks. Embedding...")

    chunk_texts = [c.content for c in chunks]
    embeddings = embedding_service.get_embeddings_batch(chunk_texts, batch_size=60)

    records = []
    for i, c in enumerate(chunks):
        emb = embeddings[i] if i < len(embeddings) else [0.0] * 1536
        records.append({
            "document_id": doc_id,
            "unit_code": unit_code,
            "page_number": c.page_number,
            "slide_title": (c.slide_title or "")[:150],
            "content": c.content,
            "embedding": emb,
            "metadata": c.metadata
        })

    # Insert in safe batches of 50
    for i in range(0, len(records), 50):
        client.table("document_chunks").insert(records[i:i+50]).execute()

    client.table("documents").update({"is_processed": True}).eq("id", doc_id).execute()
    print(f"  ✓ Successfully indexed {file_name} ({len(chunks)} chunks in Supabase)!")


def main():
    print("=" * 60)
    print("INGESTING USER'S DOWNLOADED NOTES INTO SUPABASE ACADEMIC UNITS")
    print("=" * 60)
    for fn, unit in NOTES_TO_INGEST:
        ingest_file(fn, unit)
    print("\n✓ Ingestion of all downloaded notes complete!")


if __name__ == "__main__":
    main()
