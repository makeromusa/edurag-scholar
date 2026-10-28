import os
import glob
import time
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

USER_ID = '9bd58ed8-3c71-4b9a-be11-83813b71456f'
resp = supabase.table('documents').select('*').limit(1).execute()
print("Columns in documents:", resp.data[0].keys() if resp.data else "empty")

resp = supabase.table('documents').select('id, title, unit_code, page_count').eq('uploaded_by', USER_ID).order('unit_code').execute()
print(f'Total docs in DB: {len(resp.data)}')
current_unit = None
db_titles = set()
for d in resp.data:
    db_titles.add(d['title'].lower().strip())
    if d['unit_code'] != current_unit:
        current_unit = d['unit_code']
        print(f'\n--- UNIT: {current_unit} ---')
    pages = d.get('page_count', '?')
    print(f"{d['id'][:8]} | {str(pages):>4} pgs | {d['title']}")

print('\n' + '='*60)
print('CHECKING DOWNLOADS DIRECTORY FOR POTENTIAL UNINDEXED ACADEMIC FILES')
print('='*60)

download_dir = r'C:\Users\HomePC\Downloads'
all_files = glob.glob(os.path.join(download_dir, '*.pdf'))
all_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)

unindexed = []
for f in all_files:
    bname = os.path.basename(f)
    clean = os.path.splitext(bname)[0].lower().strip()
    
    # Check if exact title or clean title in db_titles
    match = False
    for t in db_titles:
        if clean in t or t in clean:
            match = True
            break
        # strip duplicate notation like (1)
        base = clean.replace(' (1)', '').replace(' (2)', '')
        if base in t or t in base:
            match = True
            break
            
    if not match:
        sz_mb = os.path.getsize(f) / (1024 * 1024)
        mtime_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(os.path.getmtime(f)))
        unindexed.append((mtime_str, sz_mb, bname, f))

print(f'\nFound {len(unindexed)} unindexed PDFs in Downloads:')
for mtime_str, sz_mb, bname, f in unindexed:
    print(f'{mtime_str} | {sz_mb:6.2f} MB | {bname}')
