import os
import json
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xccrkalsujefsghtuirp.supabase.co")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

BACKUPS_DIR = os.path.abspath("backend/backups")
os.makedirs(BACKUPS_DIR, exist_ok=True)

def run_backup():
    print("=" * 80)
    print("EDURAG SCHOLAR AUTOMATED DATABASE BACKUP PROTOCOL")
    print("=" * 80)

    if not SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY missing from environment.")
        return

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUPS_DIR, f"edurag_db_backup_{timestamp}.json")

    tables = ["units", "documents", "document_chunks", "timetable_slots", "profiles", "weakness_logs", "daily_briefings"]
    backup_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_url": SUPABASE_URL,
        "tables": {}
    }

    for t in tables:
        url = f"{SUPABASE_URL}/rest/v1/{t}?select=*"
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code == 200:
                rows = r.json()
                backup_data["tables"][t] = rows
                print(f"  [OK] Exported '{t}': {len(rows)} records")
            else:
                print(f"  [WARN] Failed to export '{t}': {r.status_code}")
        except Exception as e:
            print(f"  [ERROR] Error querying table '{t}': {e}")

    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, indent=2)

    file_size_kb = os.path.getsize(backup_file) / 1024
    print("-" * 80)
    print(f"SUCCESS: Full backup saved to: {backup_file} ({file_size_kb:.2f} KB)")
    print("=" * 80)

if __name__ == "__main__":
    run_backup()
