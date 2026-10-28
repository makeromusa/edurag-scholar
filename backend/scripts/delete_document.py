import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import get_supabase_admin_client


def delete_document(search_term: str):
    client = get_supabase_admin_client()

    # Search for matching documents by title or id
    query = client.table("documents").select("id, title, unit_code, page_count")
    if len(search_term) == 36 and "-" in search_term:
        res = query.eq("id", search_term).execute()
    else:
        res = query.ilike("title", f"%{search_term}%").execute()

    docs = res.data or []
    if not docs:
        print(f"❌ No document found matching '{search_term}'.")
        return

    print(f"\nFound {len(docs)} matching document(s):")
    for d in docs:
        doc_id = d["id"]
        title = d["title"]
        unit = d["unit_code"]
        pages = d["page_count"]

        # 1. Purge all chunks
        chunk_res = client.table("document_chunks").delete().eq("document_id", doc_id).execute()

        # 2. Delete the document record
        client.table("documents").delete().eq("id", doc_id).execute()

        print(f"  ✓ Purged: [{unit}] '{title}' (ID: {doc_id}, {pages} pages) and all vector embeddings.")

    print("\n✓ Deletion complete.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/delete_document.py <document_title_or_id>")
        print("Example: python backend/scripts/delete_document.py \"os_merged\"")
        sys.exit(1)

    delete_document(sys.argv[1])
