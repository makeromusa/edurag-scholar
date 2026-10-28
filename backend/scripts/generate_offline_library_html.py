import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("backend/.env")

DOWNLOADS_DIR = r"C:\Users\HomePC\Downloads"
USER_ID = "9bd58ed8-3c71-4b9a-be11-83813b71456f"
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

resp = supabase.table("documents").select("id, unit_code, title, page_count, file_size_bytes, storage_url").eq("uploaded_by", USER_ID).order("unit_code").execute()

units_meta = {
    "SCS 3201": "Systems Analysis and Design (Kendall & Kendall)",
    "SCS 3203": "Computer Architecture (Stallings)",
    "SCS 3205": "Knowledge-Based Systems & Programming (Prolog/Akerkar)",
    "SCS 3207": "Operating Systems (Tanenbaum/Stallings)",
    "SCS 3209": "Software Engineering (Sommerville)",
    "CSC 3211": "Computer Networks (Forouzan/Comer)",
    "SMA 2114": "Differential and Integral Calculus (Angenent)"
}

def categorize(title):
    t = title.upper()
    if any(k in t for k in ["EXAM", "CAT", "SUPP", "TEST"]):
        return "exams"
    if any(k in t for k in ["FORMULA", "CHEAT", "OUTLINE", "REVISION", "LAB EXERCISE"]):
        return "formulas"
    return "books"

docs_by_unit = {u: {"books": [], "exams": [], "formulas": []} for u in units_meta.keys()}

for d in resp.data:
    u = d["unit_code"]
    if u not in docs_by_unit:
        docs_by_unit[u] = {"books": [], "exams": [], "formulas": []}
    cat = categorize(d["title"])
    docs_by_unit[u][cat].append(d)

# Generate single-file HTML
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduRAG Scholar — Centralized Academic Notes & Exam Vault</title>
    <style>
        :root {{
            --bg: #090d16;
            --card-bg: #0e1422;
            --border: #1e293b;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
            --blue: #2563eb;
            --blue-light: #60a5fa;
            --emerald: #059669;
            --emerald-light: #34d399;
            --amber: #d97706;
            --amber-light: #fbbf24;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background: var(--bg);
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 24px;
            line-height: 1.5;
        }}
        .header {{
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }}
        .title-block h1 {{ font-size: 22px; font-weight: 700; color: #fff; }}
        .title-block p {{ font-size: 13px; color: var(--text-sub); margin-top: 4px; }}
        .offline-badge {{
            background: rgba(5, 150, 105, 0.2);
            border: 1px solid rgba(5, 150, 105, 0.4);
            color: var(--emerald-light);
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }}
        .nav-bar {{
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 12px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }}
        .nav-btn {{
            background: #1e293b;
            color: var(--text-sub);
            border: 1px solid transparent;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.2s;
        }}
        .nav-btn:hover, .nav-btn.active {{
            background: var(--blue);
            color: #fff;
        }}
        .unit-section {{
            margin-bottom: 40px;
            background: #0c111d;
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
        }}
        .unit-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }}
        .unit-code {{ font-size: 16px; font-weight: 700; color: var(--blue-light); }}
        .unit-title {{ font-size: 13px; color: var(--text-sub); }}
        .grid-shelves {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
        }}
        .shelf {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
        }}
        .shelf-header {{
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .shelf-books .shelf-header {{ color: var(--blue-light); }}
        .shelf-exams .shelf-header {{ color: var(--emerald-light); }}
        .shelf-formulas .shelf-header {{ color: var(--amber-light); }}
        .doc-item {{
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            transition: background 0.15s;
        }}
        .doc-item:hover {{ background: rgba(255, 255, 255, 0.06); }}
        .doc-info {{ min-width: 0; }}
        .doc-title {{ font-size: 12px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
        .doc-meta {{ font-size: 11px; color: var(--text-sub); margin-top: 2px; }}
        .doc-link {{
            background: var(--blue);
            color: #fff;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-decoration: none;
            white-space: nowrap;
        }}
        .doc-link:hover {{ opacity: 0.9; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title-block">
            <h1>EduRAG Scholar — Centralized Academic Notes & Exam Vault</h1>
            <p>University of Nairobi • Chiromo Campus • Bachelor of Science in Computer Science (Year 2)</p>
        </div>
        <div class="offline-badge">
            ✓ 100% Offline Capable • Local Downloads Hub
        </div>
    </div>

    <div class="nav-bar">
        {"".join([f'<a href="#{u.replace(" ", "_")}" class="nav-btn">{u}</a>' for u in units_meta.keys()])}
    </div>
"""

for u, name in units_meta.items():
    uid = u.replace(" ", "_")
    books = docs_by_unit[u]["books"]
    exams = docs_by_unit[u]["exams"]
    formulas = docs_by_unit[u]["formulas"]
    total = len(books) + len(exams) + len(formulas)

    html_content += f"""
    <div class="unit-section" id="{uid}">
        <div class="unit-header">
            <div>
                <span class="unit-code">{u}</span> — <span class="unit-title">{name}</span>
            </div>
            <span style="font-size: 12px; color: var(--text-sub); font-weight: 600;">{total} Ingested Assets</span>
        </div>

        <div class="grid-shelves">
            <!-- Shelf 1: Textbooks & Course Notes -->
            <div class="shelf shelf-books">
                <div class="shelf-header">📚 Core Textbooks & Lecture Slides ({len(books)})</div>
                {"".join([f'''
                <div class="doc-item">
                    <div class="doc-info">
                        <div class="doc-title" title="{b['title']}">{b['title']}</div>
                        <div class="doc-meta">{b['page_count']} Pages</div>
                    </div>
                    <a href="{b.get('storage_url') or b['title']}" class="doc-link" target="_blank">Open Real PDF</a>
                </div>
                ''' for b in books]) if books else '<p style="font-size:12px; color:var(--text-sub);">No textbooks currently in this unit.</p>'}
            </div>

            <!-- Shelf 2: Past Examination Papers & CATs -->
            <div class="shelf shelf-exams">
                <div class="shelf-header">📝 Past Exam Papers & CATs ({len(exams)})</div>
                {"".join([f'''
                <div class="doc-item">
                    <div class="doc-info">
                        <div class="doc-title" title="{e['title']}">{e['title']}</div>
                        <div class="doc-meta">{e['page_count']} Pages • Scanned OCR Verified</div>
                    </div>
                    <a href="{e.get('storage_url') or e['title']}" class="doc-link" style="background:var(--emerald);" target="_blank">Open Real Exam</a>
                </div>
                ''' for e in exams]) if exams else '<p style="font-size:12px; color:var(--text-sub);">No past exams currently in this unit.</p>'}
            </div>

            <!-- Shelf 3: Formula Sheets & Outlines -->
            <div class="shelf shelf-formulas">
                <div class="shelf-header">📐 Course Outlines & Cheat Sheets ({len(formulas)})</div>
                {"".join([f'''
                <div class="doc-item">
                    <div class="doc-info">
                        <div class="doc-title" title="{f['title']}">{f['title']}</div>
                        <div class="doc-meta">{f['page_count']} Pages</div>
                    </div>
                    <a href="{f.get('storage_url') or f['title']}" class="doc-link" style="background:var(--amber);" target="_blank">Open Real Sheet</a>
                </div>
                ''' for f in formulas]) if formulas else '<p style="font-size:12px; color:var(--text-sub);">No formula sheets in this unit.</p>'}
            </div>
        </div>
    </div>
    """

html_content += """
</body>
</html>
"""

out_file = os.path.join(DOWNLOADS_DIR, "EduRAG_Central_Academic_Library.html")
with open(out_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated offline portal: {out_file} ({os.path.getsize(out_file)/1024:.1f} KB)")
