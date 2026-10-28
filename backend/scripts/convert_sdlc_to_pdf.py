import os
import re
import json
import subprocess
import time
from pathlib import Path
import fitz  # PyMuPDF

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SDLC_DIR = Path(r"c:\Users\HomePC\.gemini\antigravity\scratch\academic-rag-copilot\docs\sdlc_suite")
DOWNLOADS_DIR = Path(r"C:\Users\HomePC\Downloads")
PDF_OUTPUT_DIR = DOWNLOADS_DIR / "EduRAG_SDLC_PDFs"

# Ordered list of all 13 SDLC documents + Master Index
DOCUMENTS_IN_ORDER = [
    ("00_SDLC_Master_Engineering_Suite", "README.md", "EduRAG Scholar SDLC Master Engineering Specification Suite"),
    ("01_BRD_Business_Requirements_Document", "01_BRD_Business_Requirements_Document.md", "Business Requirements Document (BRD)"),
    ("02_URD_User_Requirements_Document", "02_URD_User_Requirements_Document.md", "User Requirements Document (URD / URS)"),
    ("03_SRS_Software_Requirements_Specification", "03_SRS_Software_Requirements_Specification.md", "Software Requirements Specification (SRS) - IEEE 830"),
    ("04_SAD_Software_Architecture_Document", "04_SAD_Software_Architecture_Document.md", "Software Architecture Document (SAD) - C4 Model"),
    ("05_HLD_High_Level_Design", "05_HLD_High_Level_Design.md", "High-Level Design Document (HLD)"),
    ("06_LLD_Low_Level_Design", "06_LLD_Low_Level_Design.md", "Low-Level Design Document (LLD)"),
    ("07_DBDD_Database_Design_Data_Dictionary", "07_DBDD_Database_Design_Data_Dictionary.md", "Database Design & Data Dictionary (DBDD)"),
    ("08_SEMP_Methodology_Agile_Plan", "08_SEMP_Methodology_Agile_Plan.md", "Software Engineering Management Plan & Agile Methodology (SEMP)"),
    ("09_STP_Software_Test_Plan_QA", "09_STP_Software_Test_Plan_QA.md", "Software Test Plan & QA Strategy (STP)"),
    ("10_SecOps_Security_Architecture_STRIDE", "10_SecOps_Security_Architecture_STRIDE.md", "Security Architecture & STRIDE Threat Model (SecOps)"),
    ("11_DevOps_CICD_Deployment_Runbook", "11_DevOps_CICD_Deployment_Runbook.md", "DevOps, CI/CD & Deployment Runbook"),
    ("12_SRE_Operations_Monitoring_DR_Runbook", "12_SRE_Operations_Monitoring_DR_Runbook.md", "SRE, Operations & Disaster Recovery Runbook"),
    ("13_UAT_Handover_Maintenance_Plan", "13_UAT_Handover_Maintenance_Plan.md", "User Acceptance Testing & Handover Plan (UAT)")
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <style>
    @page {{
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      font-size: 10pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}
    h1 {{
      font-size: 17pt;
      color: #0f172a;
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 1.4rem;
      margin-bottom: 0.8rem;
      page-break-after: avoid;
    }}
    h2 {{
      font-size: 13pt;
      color: #1e293b;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 1.3rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }}
    h3 {{
      font-size: 11pt;
      color: #334155;
      margin-top: 1rem;
      margin-bottom: 0.3rem;
      page-break-after: avoid;
    }}
    p, li {{
      color: #334155;
      margin-bottom: 0.45rem;
    }}
    
    /* MERMAID DIAGRAM SCALING - NEVER CUT OFF HORIZONTALLY */
    .mermaid {{
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1.5rem auto !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      box-sizing: border-box;
      overflow: visible !important;
    }}
    .mermaid svg {{
      max-width: 100% !important;
      height: auto !important;
      max-height: 480px !important;
      display: block !important;
      margin: 0 auto !important;
    }}
    
    table {{
      width: 100% !important;
      border-collapse: collapse;
      margin: 1.2rem 0;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      font-size: 8.5pt;
    }}
    th {{
      background: #0f172a;
      color: #ffffff;
      padding: 7px 10px;
      font-weight: 600;
      text-align: left;
      border: 1px solid #0f172a;
    }}
    td {{
      padding: 6px 9px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      vertical-align: top;
    }}
    tr:nth-child(even) td {{
      background-color: #f8fafc;
    }}
    code {{
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 4px;
      border-radius: 3px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
    }}
    pre {{
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 8pt;
      font-family: Consolas, "Courier New", monospace;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow-x: auto;
      border: 1px solid #1e293b;
      line-height: 1.45;
    }}
    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }}
    blockquote {{
      margin: 1rem 0;
      padding: 8px 16px;
      border-left: 4px solid #2563eb;
      background: #eff6ff;
      color: #1e40af;
      border-radius: 0 6px 6px 0;
    }}
    .document-header {{
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 0.8rem;
      border-bottom: 3px double #cbd5e1;
    }}
    .document-header .org {{
      font-size: 11pt;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .document-header .doc-id {{
      font-size: 9pt;
      color: #64748b;
      margin-top: 4px;
    }}
  </style>
</head>
<body>
  <div class="document-header">
    <div class="org">University of Nairobi • Faculty of Science & Technology</div>
    <div class="doc-id">EduRAG Scholar SDLC Master Engineering Specification Suite</div>
  </div>

  <div id="content"></div>

  <script>
    const md = {raw_markdown_json};
    document.getElementById('content').innerHTML = marked.parse(md);

    // Replace <pre><code class="language-mermaid"> with <div class="mermaid"> using decoded textContent
    document.querySelectorAll('pre code.language-mermaid').forEach(el => {{
      const pre = el.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = el.textContent.trim();
      pre.replaceWith(div);
    }});

    mermaid.initialize({{
      startOnLoad: false,
      theme: 'neutral',
      flowchart: {{ useMaxWidth: true, htmlLabels: true, curve: 'basis' }},
      sequence: {{ useMaxWidth: true }},
      class: {{ useMaxWidth: true }},
      er: {{ useMaxWidth: true }},
      securityLevel: 'loose'
    }});

    try {{
      renderMathInElement(document.body, {{
        delimiters: [
          {{left: '$$', right: '$$', display: true}},
          {{left: '$', right: '$', display: false}}
        ],
        throwOnError: false
      }});
    }} catch(e) {{ console.warn(e); }}

    (async () => {{
      const els = document.querySelectorAll('.mermaid');
      for (const el of els) {{
        try {{
          await mermaid.run({{ nodes: [el] }});
        }} catch(err) {{
          console.warn("Mermaid error in block:", err);
        }}
      }}
    }})();
  </script>
</body>
</html>
"""

def generate_all_pdfs():
    PDF_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temp_dir = DOWNLOADS_DIR / ".temp_html"
    temp_dir.mkdir(parents=True, exist_ok=True)

    generated_pdf_paths = []

    print("=" * 70)
    print("Converting 13 SDLC Engineering Documents + Master Index to PDF")
    print(f"Target Output Folder: {PDF_OUTPUT_DIR}")
    print("=" * 70)

    for idx, (doc_code, filename, doc_title) in enumerate(DOCUMENTS_IN_ORDER, 1):
        md_path = SDLC_DIR / filename
        if not md_path.exists():
            print(f"[{idx}/{len(DOCUMENTS_IN_ORDER)}] SKIP: {filename} not found.")
            continue

        print(f"[{idx}/{len(DOCUMENTS_IN_ORDER)}] Rendering: {doc_code}.pdf ...")

        with open(md_path, "r", encoding="utf-8") as f:
            md_text = f.read()

        html_content = HTML_TEMPLATE.format(
            title=doc_title,
            raw_markdown_json=json.dumps(md_text)
        )

        temp_html_path = temp_dir / f"{doc_code}.html"
        output_pdf_path = PDF_OUTPUT_DIR / f"{doc_code}.pdf"
        direct_downloads_pdf = DOWNLOADS_DIR / f"{doc_code}.pdf"

        with open(temp_html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        cmd = [
            CHROME_PATH,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=5000",
            f"--print-to-pdf={output_pdf_path}",
            str(temp_html_path)
        ]

        res = subprocess.run(cmd, capture_output=True, text=True)
        if output_pdf_path.exists() and output_pdf_path.stat().st_size > 0:
            # Also copy directly to Downloads folder root for convenient access
            with open(output_pdf_path, "rb") as src, open(direct_downloads_pdf, "wb") as dst:
                dst.write(src.read())

            doc_pdf = fitz.open(str(output_pdf_path))
            page_cnt = len(doc_pdf)
            size_kb = output_pdf_path.stat().st_size / 1024
            print(f"    -> [OK] Generated: {doc_code}.pdf ({page_cnt} pages, {size_kb:.1f} KB)")
            generated_pdf_paths.append(output_pdf_path)
        else:
            print(f"    -> [FAIL] Failed to generate {doc_code}.pdf (Code: {res.returncode})")

    # Clean up temp html directory
    try:
        for f in temp_dir.glob("*.html"):
            f.unlink()
        temp_dir.rmdir()
    except Exception:
        pass

    # Produce Unified Master Compilation PDF
    print("\n" + "=" * 70)
    print("Creating Unified Master Compilation Volume...")
    master_compilation_pdf = DOWNLOADS_DIR / "EduRAG_Scholar_Complete_SDLC_Engineering_Master_Suite.pdf"
    master_doc = fitz.open()

    for pdf_path in generated_pdf_paths:
        try:
            sub_doc = fitz.open(str(pdf_path))
            master_doc.insert_pdf(sub_doc)
        except Exception as e:
            print(f"Warning inserting {pdf_path.name}: {e}")

    master_doc.save(str(master_compilation_pdf))
    print(f"SUCCESS: Unified Master Volume saved to: {master_compilation_pdf}")
    print(f"Total Pages across Master Volume: {len(master_doc)} pages")
    print(f"Total File Size: {master_compilation_pdf.stat().st_size / (1024*1024):.2f} MB")
    print("=" * 70)

if __name__ == "__main__":
    generate_all_pdfs()
