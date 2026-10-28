import os
import sys
from dotenv import load_dotenv
from supabase import create_client

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv("backend/.env")

USER_ID = "9bd58ed8-3c71-4b9a-be11-83813b71456f"
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

resp = supabase.table("documents").select("id, title, storage_url").eq("uploaded_by", USER_ID).execute()
print(f"Syncing real PDFs for {len(resp.data)} user documents to Supabase Storage...")

search_dirs = [
    r"C:\Users\HomePC\Downloads",
    os.path.abspath("docs/sdlc_suite"),
    os.path.abspath("docs/offline_study")
]

synced_count = 0
for d in resp.data:
    title = d["title"]
    doc_id = d["id"]

    # Locate real file
    found_path = None
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        p1 = os.path.join(sdir, title)
        p2 = os.path.join(sdir, f"{title}.pdf")
        if os.path.isfile(p1):
            found_path = p1
            break
        elif os.path.isfile(p2):
            found_path = p2
            break

    if not found_path:
        # Case-insensitive search
        for sdir in search_dirs:
            if not os.path.exists(sdir):
                continue
            for fname in os.listdir(sdir):
                if fname.lower() == title.lower() or fname.lower() == f"{title.lower()}.pdf":
                    found_path = os.path.join(sdir, fname)
                    break
            if found_path:
                break

    if found_path:
        bname = os.path.basename(found_path)
        # Upload to Supabase Storage bucket 'course-documents'
        try:
            with open(found_path, "rb") as f:
                supabase.storage.from_("course-documents").upload(
                    bname, f, file_options={"content-type": "application/pdf", "upsert": "true"}
                )
            pub_url = supabase.storage.from_("course-documents").get_public_url(bname)
            # Update storage_url in documents table
            supabase.table("documents").update({"storage_url": pub_url}).eq("id", doc_id).execute()
            synced_count += 1
            print(f"[OK] {title[:40]} -> {pub_url}")
        except Exception as e:
            print(f"[ERR] Failed to upload {title}: {e}")
    else:
        print(f"[WARN] Local file not found for: {title}")

print(f"\nSuccessfully synced {synced_count}/{len(resp.data)} documents to real PDF storage!")
