import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import get_supabase_admin_client

client = get_supabase_admin_client()
res = client.table("documents").select("id, unit_code, title, page_count, uploaded_by, is_processed").execute()
print(f"Total documents in Supabase: {len(res.data or [])}")
for d in res.data or []:
    print(f"- [{d.get('unit_code')}] {d.get('title')} ({d.get('page_count')} pages) User: {d.get('uploaded_by')}")
