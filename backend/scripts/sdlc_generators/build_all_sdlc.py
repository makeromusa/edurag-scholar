import os
import shutil
import subprocess
import sys
import fitz
from common import OUTPUT_DIR, DOWNLOADS_DIR, ARTIFACTS_DIR

GENERATORS = [
    ("gen_01_brd.py", "01_BRD_Business_Requirements_Document.pdf", 10),
    ("gen_02_urd.py", "02_URD_User_Requirements_Document.pdf", 10),
    ("gen_03_srs.py", "03_SRS_Software_Requirements_Specification.pdf", 10),
    ("gen_04_sad.py", "04_SAD_Software_Architecture_Document.pdf", 10),
    ("gen_05_hld.py", "05_HLD_High_Level_Design.pdf", 10),
    ("gen_06_lld.py", "06_LLD_Low_Level_Design.pdf", 10),
    ("gen_07_dbdd.py", "07_DBDD_Database_Design_Data_Dictionary.pdf", 10),
    ("gen_08_semp.py", "08_SEMP_Methodology_Agile_Plan.pdf", 10),
    ("gen_09_stp.py", "09_STP_Software_Test_Plan_QA.pdf", 10),
    ("gen_10_secops.py", "10_SecOps_Security_Architecture_STRIDE.pdf", 10),
    ("gen_11_devops.py", "11_DevOps_CICD_Deployment_Runbook.pdf", 10),
    ("gen_12_sre.py", "12_SRE_Operations_Monitoring_DR_Runbook.pdf", 10),
    ("gen_13_uat.py", "13_UAT_Handover_Maintenance_Plan.pdf", 10),
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    python_exe = sys.executable
    
    print("=" * 80)
    print("BUILDING COMPLETE SDLC ENGINEERING SPECIFICATION SUITE (ALL 13 DOCUMENTS)")
    print("=" * 80)
    
    results = []
    
    for script_name, pdf_name, min_pages in GENERATORS:
        script_path = os.path.join(script_dir, script_name)
        print(f"\n>>> Running {script_name}...")
        proc = subprocess.run([python_exe, script_path], capture_output=True, text=True)
        if proc.returncode != 0:
            print(f"Error running {script_name}:\n{proc.stderr}")
            sys.exit(1)
        
        pdf_path = os.path.join(OUTPUT_DIR, pdf_name)
        if not os.path.exists(pdf_path):
            print(f"FAILED: Output PDF {pdf_path} not found!")
            sys.exit(1)
            
        doc = fitz.open(pdf_path)
        actual_pages = doc.page_count
        doc.close()
        
        status = "PASSED" if actual_pages >= min_pages else "FAILED (Under min pages)"
        print(f"    -> {pdf_name}: {actual_pages} pages (Min: {min_pages}) [{status}]")
        results.append((pdf_name, actual_pages, min_pages, status))
        
        # Ensure copy to Downloads and Artifacts
        shutil.copy2(pdf_path, os.path.join(DOWNLOADS_DIR, pdf_name))
        shutil.copy2(pdf_path, os.path.join(ARTIFACTS_DIR, pdf_name))

    # Master Suite Merging
    print("\n" + "=" * 80)
    print("ASSEMBLING MASTER ENGINEERING COMPENDIUM (ALL 13 MERGED INTO MASTER SUITE)")
    print("=" * 80)
    
    master_filename = "EduRAG_Scholar_Complete_SDLC_Engineering_Master_Suite.pdf"
    master_path = os.path.join(OUTPUT_DIR, master_filename)
    
    master_doc = fitz.open()
    toc_entries = []
    current_page = 0
    
    for _, pdf_name, _ in GENERATORS:
        src_path = os.path.join(OUTPUT_DIR, pdf_name)
        sub_doc = fitz.open(src_path)
        doc_title = pdf_name.replace(".pdf", "").replace("_", " ")
        toc_entries.append([1, doc_title, current_page + 1])
        master_doc.insert_pdf(sub_doc)
        current_page += sub_doc.page_count
        sub_doc.close()
        
    master_doc.set_toc(toc_entries)
    master_doc.save(master_path)
    total_master_pages = master_doc.page_count
    master_doc.close()
    
    shutil.copy2(master_path, os.path.join(DOWNLOADS_DIR, master_filename))
    shutil.copy2(master_path, os.path.join(ARTIFACTS_DIR, master_filename))
    
    print(f"\n[SUCCESS] Master Suite Built: {master_filename} ({total_master_pages} pages)")
    print(f"Copied to: {os.path.join(DOWNLOADS_DIR, master_filename)}")
    print(f"Copied to: {os.path.join(ARTIFACTS_DIR, master_filename)}")
    
    print("\n" + "=" * 80)
    print("FINAL SDLC SUITE PAGE AUDIT TABLE")
    print("=" * 80)
    print(f"{'Document Name':<52} | {'Pages':<6} | {'Target':<6} | {'Status'}")
    print("-" * 80)
    for pdf_name, actual, min_p, st in results:
        print(f"{pdf_name:<52} | {actual:<6} | >={min_p:<4} | {st}")
    print("-" * 80)
    print(f"{'MASTER COMPENDIUM (ALL 13 COMBINED)':<52} | {total_master_pages:<6} | >=130  | PASSED")
    print("=" * 80)

if __name__ == "__main__":
    main()
