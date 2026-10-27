import os
import sys
from pathlib import Path

# Set up python path so backend/app can be imported
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_supabase_admin_client

USER_ID = "9bd58ed8-3c71-4b9a-be11-83813b71456f"
DOWNLOADS_DIR = Path(r"C:\Users\HomePC\Downloads")

def check_status():
    client = get_supabase_admin_client()
    res = client.table("documents").select("id, unit_code, title, page_count, uploaded_by, is_processed").execute()
    existing_titles = {d.get('title'): d for d in res.data}
    print(f"Total documents currently in Supabase: {len(res.data)}")
    for d in res.data:
        print(f" - [{d.get('unit_code')}] {d.get('title')} (Pages: {d.get('page_count')}, Processed: {d.get('is_processed')}, User: {d.get('uploaded_by')})")

    # List files in Downloads
    print("\nScanning Downloads folder for candidate notes...")
    valid_exts = {".pdf", ".pptx", ".docx"}
    all_files = [f for f in DOWNLOADS_DIR.iterdir() if f.is_file() and f.suffix.lower() in valid_exts]
    
    print("\nDetails of all files:")
    for f in sorted(all_files, key=lambda x: x.name):
        size = f.stat().st_size
        already = "ALREADY INGESTED" if f.name in existing_titles else "NEW"
        print(f"  [{already}] {f.name} ({size} bytes)")


if __name__ == "__main__":
    check_status()
