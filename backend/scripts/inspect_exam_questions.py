import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

USER_ID = '9bd58ed8-3c71-4b9a-be11-83813b71456f'
resp = supabase.table('documents').select('id, title, unit_code').eq('uploaded_by', USER_ID).ilike('title', '%EXAM%').execute()

chk = supabase.table('document_chunks').select('*').limit(1).execute()
print("document_chunks columns:", chk.data[0].keys() if chk.data else "empty")

print(f"Total exam papers: {len(resp.data)}")
for d in resp.data:
    chunks = supabase.table('document_chunks').select('content, chunk_index').eq('document_id', d['id']).limit(2).execute() if 'chunk_index' in chk.data[0] else supabase.table('document_chunks').select('content').eq('document_id', d['id']).limit(2).execute()
    print(f"\n=== [{d['unit_code']}] {d['title']} ===")
    for c in chunks.data:
        snippet = c.get('content', '')[:200].replace('\n', ' ')
        print(f"  Snippet: {snippet}...")
