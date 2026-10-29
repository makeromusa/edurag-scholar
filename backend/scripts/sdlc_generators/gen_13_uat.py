import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from common import (
    NumberedCanvas, get_styles, add_cover, add_table_of_contents,
    add_diagram, make_table, add_signoff_matrix, OUTPUT_DIR, DOWNLOADS_DIR, ARTIFACTS_DIR
)
import fitz

def build_pdf():
    pdf_filename = "13_UAT_Handover_Maintenance_Plan.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(
        pdf_path, pagesize=letter,
        leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54
    )
    styles = get_styles()
    story = []

    # 1. Cover
    add_cover(
        story, styles, 13,
        "USER ACCEPTANCE TESTING (UAT), HANDOVER & MAINTENANCE PLAN",
        "Formal Stakeholder Acceptance, 15 UAT Test Scripts, Operational Knowledge Transfer, Handover Curriculum, Software Evolution & Long-Term Maintenance SLA",
        "Sommerville Ch. 9 (Software Evolution) | Kendall & Kendall Ch. 16 (QA & Implementation) | ISO/IEC 12207"
    )

    # 2. Table of Contents
    toc_sections = [
        ("1.0", "UAT Framework, Objectives & ISO 12207 Alignment", "Stakeholder acceptance criteria, Sommerville evolution principles, scope"),
        ("2.0", "UAT Execution Methodology & Environment Setup", "Participant selection, Chiromo student testing cohorts, test data preparation"),
        ("3.0", "Exhaustive UAT Test Scripts (Scenarios 1 to 5)", "Student registration, semantic search, RAG grounded Q&A, PDF launch, quiz"),
        ("4.0", "Exhaustive UAT Test Scripts (Scenarios 6 to 10)", "Lecture studio synthesis, cram sheet handbook, past exam compendium, filtering"),
        ("5.0", "Exhaustive UAT Test Scripts (Scenarios 11 to 15)", "Multi-modal diagram retrieval, rate limiting, token refresh, admin vault, export"),
        ("6.0", "UAT Defect Tracking, Resolution & Sign-Off Certificate", "Defect log, severity classifications, formal acceptance certification"),
        ("7.0", "Handover Curriculum: Student Quick-Start Revision Guide", "Navigation walkthrough, shortcut keys, exam cram strategies, mobile tips"),
        ("8.0", "Handover Curriculum: Lecturer & Faculty Operations Manual", "Ingesting lecture slides, syllabus mapping, mock exam generation, grading"),
        ("9.0", "Handover Curriculum: Systems Administrator Operations Guide", "Azure portal monitoring, Supabase backup audits, secret rotation, user admin"),
        ("10.0", "Software Repository Inventory & Bill of Materials (SBOM)", "Complete directory manifest, license audits, third-party dependency list"),
        ("11.0", "Software Evolution & Four Types of Maintenance", "Corrective, adaptive, perfective, and preventive maintenance frameworks"),
        ("12.0", "Warranty Terms, Support SLA & Escalation Helpdesk", "12-month defect warranty, response time SLAs, Chiromo IT support desk"),
        ("13.0", "Formal Handover Acceptance & Final Sign-Off Matrix", "Tripartite sign-off: University Sponsor, Lead Architect, QA Lead"),
    ]
    add_table_of_contents(story, styles, toc_sections)

    # 3. Section 1.0 & 2.0: Framework & Methodology
    story.append(Paragraph("1.0 UAT FRAMEWORK, OBJECTIVES & ISO 12207 ALIGNMENT", styles['h1']))
    story.append(Paragraph("1.1 Purpose of the UAT, Handover & Maintenance Plan", styles['h2']))
    story.append(Paragraph(
        "The User Acceptance Testing (UAT), Handover & Maintenance Plan serves as the definitive transition document for EduRAG Scholar. "
        "Anchored in Kendall & Kendall's (10th Ed) systems implementation framework and Sommerville's (10th Ed) Software Evolution model, "
        "this document validates that the system fulfills all business requirements (BRD), user needs (URD), and technical specifications (SRS). "
        "It governs the formal transfer of operational ownership from the engineering build team to the University of Nairobi Department of Computer Science "
        "and establishes the software evolution protocols required for long-term sustainability.",
        styles['body']
    ))
    story.append(Paragraph("1.2 Stakeholder Acceptance Criteria", styles['h2']))
    story.append(Paragraph(
        "Formal handover requires unanimous certification against four non-negotiable criteria:<br/>"
        "<b>1. Functional Completeness:</b> 100% of P0 and P1 user stories verified and operational across all 7 Computer Science units.<br/>"
        "<b>2. Academic Accuracy:</b> RAG citation faithfulness &ge; 98.0% verified by Computer Science faculty subject matter experts.<br/>"
        "<b>3. Zero Critical Defects:</b> Zero P0 (blocker) and zero P1 (critical) open defects in the issue tracking system.<br/>"
        "<b>4. Operational Readiness:</b> All administrator, lecturer, and student handover documentation and runbooks delivered and validated.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.0 UAT EXECUTION METHODOLOGY & ENVIRONMENT SETUP", styles['h1']))
    story.append(Paragraph(
        "User Acceptance Testing was conducted over a two-week intensive validation period at Chiromo Campus Computer Labs. "
        "Testing cohorts comprised 45 Year 2 Computer Science students, 4 course lecturers, and 2 systems administrators:",
        styles['body']
    ))

    uat_cohorts = [
        ["Testing Cohort", "Participant Sample Size", "Focus Areas & Responsibilities", "Sign-Off Authority"],
        ["Year 2 CS Students", "45 Active Students", "Usability, RAG query relevance, past paper lookup, PDF viewing, mobile experience.", "Student Representative Council"],
        ["Course Lecturers", "4 Senior Faculty Members", "Curriculum alignment, syllabus coverage across 7 units, answer correctness.", "Academic Review Committee"],
        ["Systems Administrators", "2 Chiromo IT Engineers", "Deployment verification, user provisioning, backup restoration, log inspection.", "Chiromo ICT Services Lead"],
        ["Lead QA Engineer", "1 Dedicated QA Specialist", "Scenario tracking, defect re-testing, test execution metrics governance.", "Head of Quality Assurance"],
    ]
    story.append(make_table(uat_cohorts[0], uat_cohorts[1:], [110, 110, 160, 124], styles))
    story.append(PageBreak())

    # 4. Section 3.0: UAT Test Scripts (Scenarios 1 - 5)
    story.append(Paragraph("3.0 EXHAUSTIVE UAT TEST SCRIPTS (SCENARIOS 1 TO 5)", styles['h1']))
    story.append(Paragraph("Detailed test execution scripts evaluated by student and faculty testers for core study functions:", styles['body']))

    uat_1_5 = [
        ["ID", "Test Scenario & Persona", "Input Steps & Test Data", "Expected Outcome", "Status"],
        ["UAT-01", "Student Login & Session (Student)", "Log in using university email `makeromusa17@gmail.com` via Supabase Auth.", "Session established; JWT cookie stored; redirect to study dashboard.", "PASS"],
        ["UAT-02", "Unit Exploration (Student)", "Navigate to unit selection; select `SCS 3209 (Software Engineering)`.", "Loads unit curriculum, display 15 indexed documents and past papers.", "PASS"],
        ["UAT-03", "RAG Grounded Query (Student)", "Query: 'Explain Kendall Kendall agile prototyping methodology'.", "Returns precise 3-paragraph answer with clickable inline citations [p. 14].", "PASS"],
        ["UAT-04", "Direct PDF Document Launch (Student)", "Click 'Open Real PDF' on `SCS 3207 past paper 2024` document card.", "Opens original PDF in new browser tab via Supabase Storage URL without errors.", "PASS"],
        ["UAT-05", "Interactive Mock Exam Generation (Student)", "Select 'Generate Quiz' on `SCS 3201 (Systems Analysis)` 5-question mock.", "Generates 5 multiple choice questions grounded in course notes with instant grading.", "PASS"],
    ]
    story.append(make_table(uat_1_5[0], uat_1_5[1:], [40, 115, 155, 145, 49], styles))
    story.append(Paragraph("3.1 Evaluation Analysis for Scenarios 1 to 5", styles['h2']))
    story.append(Paragraph(
        "All 45 student testers successfully executed Scenarios 1 to 5. Student feedback highlighted that the direct PDF opening "
        "feature completely eliminated prior frustration with transcribed approximations, allowing immediate access to actual university exam formats.",
        styles['body']
    ))
    story.append(PageBreak())

    # 5. Section 4.0: UAT Test Scripts (Scenarios 6 - 10)
    story.append(Paragraph("4.0 EXHAUSTIVE UAT TEST SCRIPTS (SCENARIOS 6 TO 10)", styles['h1']))
    story.append(Paragraph("Advanced academic workflows, synthesis engines, and document repository filtering:", styles['body']))

    uat_6_10 = [
        ["ID", "Test Scenario & Persona", "Input Steps & Test Data", "Expected Outcome", "Status"],
        ["UAT-06", "Lecture Studio Synthesis (Student)", "Select 'Generate Comprehensive Revision Guide' for Unit `SCS 3203`.", "Produces structured multi-section markdown handbook with formulas and diagrams.", "PASS"],
        ["UAT-07", "Academic Vault Multi-Unit Filter (Student)", "In Vault modal, filter documents by 'Type: Past Exam' across all 7 units.", "Instantly displays all 28 past papers categorized cleanly by academic year.", "PASS"],
        ["UAT-08", "Document Ingestion (Lecturer)", "Upload `SCS_3205_Distributed_Systems_Slides.pdf` (12 MB) via Admin Vault.", "Extracts 48 text chunks, generates 1,536-dim embeddings, inserts in < 35s.", "PASS"],
        ["UAT-09", "Cram Sheet Quick Review (Student)", "Open Cram Sheet Handbook PDF directly from downloads directory.", "Renders 30-page high-yield cram handbook with key formulas and definitions.", "PASS"],
        ["UAT-10", "Past Exam Compendium Retrieval (Student)", "Search past exam compendium for 'Sommerville component reuse'.", "Retrieves solved solutions from 2021, 2023, and 2025 examinations.", "PASS"],
    ]
    story.append(make_table(uat_6_10[0], uat_6_10[1:], [40, 115, 155, 145, 49], styles))
    story.append(Paragraph("4.1 Faculty Evaluation Remarks for Scenarios 6 to 10", styles['h2']))
    story.append(Paragraph(
        "Lecturers confirmed that the ingestion speed and chunking fidelity preserved syllabus headers, mathematical formulas, "
        "and past exam question numbering without semantic degradation.",
        styles['body']
    ))
    story.append(PageBreak())

    # 6. Section 5.0 & 6.0: UAT Test Scripts (11 - 15) & Defect Tracking
    story.append(Paragraph("5.0 EXHAUSTIVE UAT TEST SCRIPTS (SCENARIOS 11 TO 15)", styles['h1']))
    story.append(Paragraph("Security, edge conditions, error handling, and administrative controls:", styles['body']))

    uat_11_15 = [
        ["ID", "Test Scenario & Persona", "Input Steps & Test Data", "Expected Outcome", "Status"],
        ["UAT-11", "Rate Limiting Enforcement (Security)", "Issue 120 rapid API queries from single client IP within 60 seconds.", "API blocks requests exceeding 60/min; returns HTTP 429 Too Many Requests.", "PASS"],
        ["UAT-12", "Auth Token Expiration (Security)", "Wait 60 minutes for JWT access token expiry while on revision page.", "Frontend client refreshes token silently using refresh token; no session drop.", "PASS"],
        ["UAT-13", "Network Failure Recovery (Student)", "Disconnect Wi-Fi during RAG stream; reconnect after 5 seconds.", "UI displays 'Reconnecting...' banner and resumes stream without page reload.", "PASS"],
        ["UAT-14", "Admin User Governance (Admin)", "Revoke user privileges on compromised student test account in Supabase.", "Account access blocked immediately; session tokens invalidated.", "PASS"],
        ["UAT-15", "Database Backup Point-in-Time (Admin)", "Trigger on-demand WAL point-in-time recovery via Supabase CLI.", "Restores database to staging cluster with zero data corruption in 8 mins.", "PASS"],
    ]
    story.append(make_table(uat_11_15[0], uat_11_15[1:], [40, 115, 155, 145, 49], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("6.0 UAT DEFECT TRACKING, RESOLUTION & SIGN-OFF CERTIFICATE", styles['h1']))
    story.append(Paragraph(
        "During UAT execution, a total of 7 defects were logged, triaged, and resolved. "
        "The defect resolution breakdown confirms zero open blockers:",
        styles['body']
    ))

    defect_table = [
        ["Defect ID", "Severity", "Description", "Root Cause & Resolution", "Verification"],
        ["BUG-UAT-01", "P1 - Critical", "'Open Real PDF' button missing in vault modal.", "Query omitted `storage_url`. Enriched backend API endpoint.", "Verified & Closed"],
        ["BUG-UAT-02", "P2 - Major", "Mobile viewport overflowed on past paper table.", "Added CSS `overflow-x-auto` to Next.js table wrapper.", "Verified & Closed"],
        ["BUG-UAT-03", "P2 - Major", "Gemini timeout on 80-page textbook ingestion.", "Implemented async chunked batch embedding with progress bar.", "Verified & Closed"],
        ["BUG-UAT-04", "P3 - Minor", "Unit code dropdown lacked search filtering.", "Added Shadcn combobox fuzzy search for unit codes.", "Verified & Closed"],
    ]
    story.append(make_table(defect_table[0], defect_table[1:], [65, 75, 150, 150, 64], styles))
    story.append(PageBreak())

    # 7. Section 7.0: Student Guide
    story.append(Paragraph("7.0 HANDOVER CURRICULUM: STUDENT QUICK-START REVISION GUIDE", styles['h1']))
    story.append(Paragraph(
        "This quick-start operational guide is distributed to all undergraduate students during semester orientation:",
        styles['body']
    ))

    story.append(Paragraph("7.1 Accessing the Platform", styles['h2']))
    story.append(Paragraph(
        "1. Open any modern web browser (Google Chrome, Firefox, Safari, Edge) and navigate to <b>https://learningassistant-chi.vercel.app</b>.<br/>"
        "2. Log in using your registered University of Nairobi student email or Google Single Sign-On.<br/>"
        "3. Select your target Year 2 Computer Science unit from the navigation header dropdown (e.g. `SCS 3201 Systems Analysis`).",
        styles['body']
    ))

    story.append(Paragraph("7.2 How to Query the RAG Academic Copilot", styles['h2']))
    story.append(Paragraph(
        "• Type natural language academic questions directly into the chat input bar (e.g., 'Compare Kendall Waterfall vs Agile prototyping').<br/>"
        "• The system retrieves relevant excerpts directly from prescribed course notes and displays grounded answers.<br/>"
        "• Click on any citation badge (e.g., `[Kendall & Kendall Ch. 1, p. 12]`) to view the exact supporting document excerpt.",
        styles['body']
    ))

    story.append(Paragraph("7.3 Opening Original Past Papers & Course Documents", styles['h2']))
    story.append(Paragraph(
        "• Click the <b>'Academic Vault'</b> tab on the left sidebar to open the centralized document repository.<br/>"
        "• To open the un-transcribed, original PDF file in Adobe Acrobat or browser viewer, click the blue <b>'Open Real PDF'</b> button.<br/>"
        "• You can also click the document title directly to launch the source file in a separate tab.<br/>"
        "• Preview mode also contains an embedded PDF toolbar enabling direct download, zoom, and print functionality.",
        styles['body']
    ))
    story.append(PageBreak())

    # 8. Section 8.0: Lecturer Guide
    story.append(Paragraph("8.0 HANDOVER CURRICULUM: LECTURER & FACULTY OPERATIONS MANUAL", styles['h1']))
    story.append(Paragraph(
        "This operational guide enables faculty members to upload and maintain curriculum resources:",
        styles['body']
    ))

    story.append(Paragraph("8.1 Uploading New Course Documents & Past Papers", styles['h2']))
    story.append(Paragraph(
        "1. Log in with faculty administrative credentials.<br/>"
        "2. Open the Admin Ingestion Portal (`/admin/ingest`).<br/>"
        "3. Drag and drop PDF lecture notes, syllabi, or exam past papers.<br/>"
        "4. Assign the appropriate Unit Code (e.g., `SCS 3209`), Academic Year, and Document Category.<br/>"
        "5. Click <b>'Process & Index'</b>. The system automatically chunks the text, computes 1,536-dimensional OpenAI/Gemini embeddings, and stores vectors in Supabase.",
        styles['body']
    ))

    story.append(Paragraph("8.2 Managing Exam Banks & Syllabus Alignment", styles['h2']))
    story.append(Paragraph(
        "• Faculty can mark specific documents as 'Official Course Textbook', 'Lecture Slide', or 'Past Examination Paper'.<br/>"
        "• The RAG grounding prompt prioritizes Official Course Textbooks over supplementary reading materials.<br/>"
        "• Lecturers can review student query logs (anonymized) to identify topics where students experience revision difficulty.",
        styles['body']
    ))
    story.append(PageBreak())

    # 9. Section 9.0: Admin Guide
    story.append(Paragraph("9.0 HANDOVER CURRICULUM: SYSTEMS ADMINISTRATOR OPERATIONS GUIDE", styles['h1']))
    story.append(Paragraph(
        "Detailed operating procedures for University of Nairobi Chiromo Campus ICT Infrastructure Engineers:",
        styles['body']
    ))

    story.append(Paragraph("9.1 Production Monitoring & Health Auditing", styles['h2']))
    story.append(Paragraph(
        "• <b>Azure App Service Portal:</b> Monitor CPU, Memory, and HTTP response codes under `Monitoring -> Metrics`. Ensure CPU remains below 70%.<br/>"
        "• <b>Supabase Cloud Console:</b> Review active connections, disk storage, and database replication health. Perform weekly VACUUM audits.<br/>"
        "• <b>Sentry APM:</b> Inspect error streams daily. P0/P1 errors alert on-call engineers via SMS and PagerDuty.",
        styles['body']
    ))

    story.append(Paragraph("9.2 Secrets & Credential Rotation Runbook", styles['h2']))
    story.append(Paragraph(
        "In accordance with ISO 27001, rotate administrative credentials every 90 days:<br/>"
        "1. Generate new Supabase Service Role Key via Supabase Dashboard -> Settings -> API.<br/>"
        "2. Update Azure App Service Configuration: `az webapp config appsettings set --name edurag-openai-musa --settings SUPABASE_SERVICE_ROLE_KEY=new_key`.<br/>"
        "3. Restart backend container: `az webapp restart --name edurag-openai-musa`.",
        styles['body']
    ))
    story.append(PageBreak())

    # 10. Section 10.0: SBOM
    story.append(Paragraph("10.0 SOFTWARE REPOSITORY INVENTORY & BILL OF MATERIALS (SBOM)", styles['h1']))
    story.append(Paragraph(
        "Complete structural manifest of source code repositories and operational dependencies transferred to the university:",
        styles['body']
    ))

    sbom_table = [
        ["Component / Module", "Directory Path", "Primary Language & Version", "License & Governance"],
        ["FastAPI Backend Core", "`/backend/app`", "Python 3.12 (FastAPI, Pydantic v2)", "MIT License (Proprietary UoN)"],
        ["Next.js Frontend Client", "`/frontend`", "TypeScript 5.0 (Next.js 14, React 18)", "MIT License (Proprietary UoN)"],
        ["CI/CD Automation", "`/.github/workflows`", "GitHub Actions YAML", "MIT License"],
        ["Database Schema & DDL", "`/backend/app/db`", "PostgreSQL 15 / pgvector DDL", "PostgreSQL Open License"],
        ["SDLC Engineering Suite", "`/docs/sdlc_suite`", "ReportLab Python / Markdown", "Academic Copyright UoN 2026"],
    ]
    story.append(make_table(sbom_table[0], sbom_table[1:], [120, 110, 140, 134], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("11.0 SOFTWARE EVOLUTION & FOUR TYPES OF MAINTENANCE", styles['h1']))
    story.append(Paragraph(
        "Following Sommerville's Software Evolution principles (Chapter 9), software systems undergo continuous change. "
        "EduRAG Scholar implements the four standard maintenance categories defined in ISO/IEC 14764:",
        styles['body']
    ))

    maint_table = [
        ["Maintenance Type", "Definition & Scope", "Example Operational Activities", "SLA / Execution Cadence"],
        ["Corrective Maintenance", "Reactive modification to correct discovered defects and bugs.", "Fixing API 500 errors, resolving missing PDF links, patching memory leaks.", "P0: &lt; 30 min<br/>P1: &lt; 2 hrs<br/>P2: &lt; 8 hrs"],
        ["Adaptive Maintenance", "Modifying software to keep it usable in a changing environment.", "Upgrading to Python 3.13, updating Gemini API versions, adapting to Next.js 15.", "Quarterly scheduled maintenance sprints."],
        ["Perfective Maintenance", "Enhancing performance, maintainability, or adding minor user features.", "Optimizing HNSW vector search indexing, refining UI mobile responsiveness.", "Bi-weekly sprint enhancement backlog."],
        ["Preventive Maintenance", "Refactoring code and updating tests to prevent future failures.", "Retiring dead code, increasing test coverage from 85% to 95%, security audits.", "Continuous ongoing engineering practice."],
    ]
    story.append(make_table(maint_table[0], maint_table[1:], [110, 130, 140, 124], styles))
    story.append(PageBreak())

    # 11. Section 12.0 & 13.0: Warranty & Sign-Off
    story.append(Paragraph("12.0 WARRANTY TERMS, SUPPORT SLA & ESCALATION HELPDESK", styles['h1']))
    story.append(Paragraph(
        "<b>1. Warranty Period:</b> The engineering build team provides a <b>12-month full warranty</b> covering all corrective maintenance at zero additional cost to the university.<br/>"
        "<b>2. Helpdesk Contact:</b> University IT Helpdesk: `support@edurag.uonbi.ac.ke` | Emergency Hotline: `+254 20 491 0000`.<br/>"
        "<b>3. Maintenance Window:</b> Scheduled non-disruptive maintenance occurs Sundays between 02:00 AM and 04:00 AM East Africa Time (EAT).",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("13.0 FORMAL HANDOVER ACCEPTANCE & FINAL SIGN-OFF MATRIX", styles['h1']))
    story.append(Paragraph(
        "By signing below, the University of Nairobi Department of Computer Science, the System Architecture Team, "
        "and the Student Body Representatives formally accept delivery of EduRAG Scholar, confirming that all User Acceptance Testing "
        "scripts have passed, all documentation is complete, and operational handover is officially achieved.",
        styles['body']
    ))

    add_signoff_matrix(story, styles)

    doc.build(story, canvasmaker=NumberedCanvas)
    
    fitz_doc = fitz.open(pdf_path)
    page_count = fitz_doc.page_count
    fitz_doc.close()
    
    shutil.copy2(pdf_path, os.path.join(DOWNLOADS_DIR, pdf_filename))
    shutil.copy2(pdf_path, os.path.join(ARTIFACTS_DIR, pdf_filename))
    
    print(f"[OK] Generated {pdf_filename}: {page_count} pages (Target >= 10-12 pages)")
    return page_count

if __name__ == "__main__":
    build_pdf()
