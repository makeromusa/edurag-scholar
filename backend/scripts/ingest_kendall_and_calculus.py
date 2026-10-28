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

LATEST_FILES = [
    # SCS 3201: Systems Analysis and Design
    ("Kendall, K. E., & Kendall, J. E. (2024). Systems Analysis and Design (10th ed., Global Edition). Prentice Hall..pdf", "SCS 3201"),

    # SMA 2114: Differential and Integral Calculus
    ("Calculus II_Revision Questions.pdf", "SMA 2114"),
    ("Calculus I_Revision Questions.pdf", "SMA 2114"),
]


def ingest_file(file_name: str, unit_code: str):
    file_path = os.path.join(DOWNLOADS_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"Skipping '{file_name}': not found in Downloads.")
        return

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        print(f"Skipping '{file_name}': file is empty (0 bytes).")
        return

    client = get_supabase_admin_client()

    # Check if already indexed
    existing = client.table("documents").select("id").eq("title", file_name).eq("unit_code", unit_code).execute()
    if existing.data:
        print(f"✓ '{file_name}' is already indexed in [{unit_code}]. Skipping.")
        return

    print(f"\n========================================================")
    print(f"Ingesting '{file_name}' ({file_size / (1024*1024):.1f} MB) into [{unit_code}]...")
    t0 = time.time()

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    pages = extract_text_from_pdf(file_bytes, file_name)
    print(f"  Extracted {len(pages)} pages in {time.time() - t0:.1f}s.")

    doc_res = client.table("documents").insert({
        "unit_code": unit_code,
        "title": file_name,
        "file_type": "pdf",
        "storage_url": f"local://{file_name}",
        "file_size_bytes": file_size,
        "page_count": len(pages),
        "uploaded_by": USER_ID,
        "is_processed": False
    }).execute()

    doc_id = doc_res.data[0]["id"]
    chunks = chunk_extracted_pages(pages, unit_code=unit_code, document_id=doc_id)
    chunks = [c for c in chunks if c.content and c.content.strip()]
    print(f"  Generated {len(chunks)} chunks. Batch embedding...")

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

    # Safe batch insert into Supabase in chunks of 50
    for i in range(0, len(records), 50):
        client.table("document_chunks").insert(records[i:i+50]).execute()

    client.table("documents").update({"is_processed": True}).eq("id", doc_id).execute()
    print(f"✓ SUCCESSFULLY INDEXED '{file_name}' ({len(pages)} pages, {len(chunks)} chunks) into [{unit_code}] in {time.time() - t0:.1f}s!")


def main():
    print("=" * 60)
    print("INGESTING KENDALL & KENDALL 10TH ED & CALCULUS REVISION")
    print("=" * 60)
    for fn, unit in LATEST_FILES:
        ingest_file(fn, unit)
    print("\n✓ INGESTION COMPLETE!")


if __name__ == "__main__":
    main()
