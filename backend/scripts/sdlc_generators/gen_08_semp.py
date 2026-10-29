import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from common import (
    NumberedCanvas, get_styles, add_cover, add_table_of_contents,
    make_table, add_signoff_matrix, OUTPUT_DIR, DOWNLOADS_DIR, ARTIFACTS_DIR
)
import fitz

def build_pdf():
    pdf_filename = "08_SEMP_Methodology_Agile_Plan.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(
        pdf_path, pagesize=letter,
        leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54
    )
    styles = get_styles()
    story = []

    # 1. Cover
    add_cover(
        story, styles, 8,
        "SYSTEMS ENGINEERING MANAGEMENT PLAN (SEMP) & AGILE FRAMEWORK",
        "Scrum Execution Cadence, 4-Level Work Breakdown Structure (WBS), DoD/DoR & Sprint Velocity Governance",
        "Sommerville Ch 2 & 3: Software Processes & Agile Development | IEEE Std 1220-2005"
    )

    # 2. Table of Contents
    toc_sections = [
        ("1.0", "SEMP Scope, Engineering Philosophy & Objectives", "Systems engineering lifecycle, Agile values, UoN academic alignment"),
        ("2.0", "Agile Scrum Framework & Sprint Cadence", "Two-week sprint rhythms, time-boxed ceremonies, planning, retrospectives"),
        ("3.0", "Cross-Functional Team Organization & Roles", "Product Owner, Scrum Master, Full-Stack Engineers, AI/ML Specialist"),
        ("4.0", "Work Breakdown Structure (WBS) & 4-Level Decomposition", "Complete 4-level decomposition of Ingestion, Retrieval, UI, DevOps"),
        ("5.0", "Master Project Schedule & Milestone Gantt Roadmap", "Sprint 1 through Sprint 4 delivery milestones and target dates"),
        ("6.0", "Definition of Ready (DoR) & Definition of Done (DoD)", "Rigorous acceptance gates for backlog admission and production release"),
        ("7.0", "Source Control, GitFlow Branching & Commit Standards", "Main, develop, feature branches, semantic versioning, conventional commits"),
        ("8.0", "Code Review Protocol, Pair Programming & CI Gates", "Peer review checklists, automated linting, SonarQube quality gates"),
        ("9.0", "Agile Project Metrics: Velocity & Burn-Down Tracking", "Story points, velocity calculations, burn-down chart mechanics"),
        ("10.0", "Risk Management & Blocker Escalation Protocol", "Daily impediment logging, technical debt thresholds, resolution paths"),
        ("11.0", "Continuous Process Improvement & Retrospective Cadence", "Sprint retrospective templates, action items, process tuning"),
        ("12.0", "Formal SEMP Certification & Governance Sign-Off", "Review board approvals and technical council acceptance"),
    ]
    add_table_of_contents(story, styles, toc_sections)

    # 3. Section 1.0 & 2.0
    story.append(Paragraph("1.0 SEMP SCOPE, ENGINEERING PHILOSOPHY & OBJECTIVES", styles['h1']))
    story.append(Paragraph("1.1 Purpose of the Systems Engineering Management Plan", styles['h2']))
    story.append(Paragraph(
        "The Systems Engineering Management Plan (SEMP) establishes the operational framework governing the engineering execution, "
        "Agile delivery, and technical governance of EduRAG Scholar. In conformance with IEEE Std 1220-2005 (Standard for Application "
        "and Management of the Systems Engineering Process) and Sommerville Chapters 2 and 3, this plan harmonizes rigorous systems engineering "
        "principles with flexible, iterative Scrum execution.",
        styles['body']
    ))
    story.append(Paragraph("1.2 The Agile Systems Engineering Philosophy", styles['h2']))
    story.append(Paragraph(
        "Traditional monolithic waterfall methodologies fail in AI system development due to the experimental nature of prompt engineering, "
        "chunking parameters, and vector retrieval thresholds. EduRAG Scholar operates under an empirical feedback model: "
        "<b>(1) Working Software Over Comprehensive Documentation:</b> Every 2-week sprint yields a deployable containerized release. "
        "<b>(2) Rapid Student Feedback Loops:</b> Actual Chiromo undergraduate testing guides algorithmic adjustments. "
        "<b>(3) Uncompromising Engineering Quality:</b> Automated unit, integration, and security testing accompany all user story commits.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.0 AGILE SCRUM FRAMEWORK & SPRINT CADENCE", styles['h1']))
    story.append(Paragraph("The software development lifecycle is structured into fixed two-week (10 working days) sprint cycles:", styles['body']))

    ceremony_data = [
        ["Scrum Ceremony", "Frequency / Timing", "Duration / Time-Box", "Mandatory Attendees", "Primary Objective & Output Artifact"],
        ["Sprint Planning", "Day 1 of Sprint (09:00)", "2.0 Hours", "Entire Scrum Team", "Select backlog items, decompose into tasks, commit to Sprint Goal."],
        ["Daily Standup (Scrum)", "Mon-Fri (09:00)", "15 Minutes", "Entire Scrum Team", "Review: (1) Done yesterday, (2) Plan today, (3) Blockers."],
        ["Backlog Refinement", "Day 6 of Sprint (14:00)", "1.0 Hour", "Product Owner, Lead Dev", "Estimate story points (Fibonacci), clarify Gherkin acceptance criteria."],
        ["Sprint Review & Demo", "Day 10 of Sprint (15:00)", "1.0 Hour", "Team + Faculty Reps", "Demonstrate working software increments; collect stakeholder feedback."],
        ["Sprint Retrospective", "Day 10 of Sprint (16:30)", "45 Minutes", "Entire Scrum Team", "Evaluate team processes: What went well, what failed, action items."],
    ]
    story.append(make_table(ceremony_data[0], ceremony_data[1:], [90, 80, 80, 110, 144], styles))
    story.append(PageBreak())

    # 4. Section 3.0 & 4.0: Team Roles and WBS
    story.append(Paragraph("3.0 CROSS-FUNCTIONAL TEAM ORGANIZATION & ROLES", styles['h1']))
    story.append(Paragraph("The engineering organization operates as a highly cohesive cross-functional squad:", styles['body']))

    role_data = [
        ["Role Title", "Designated Individual", "Core Responsibilities", "Authority & Decision Scope"],
        ["Product Owner (PO)", "Academic Faculty Liaison", "Maintains product backlog, prioritizes user stories, approves acceptance.", "Final authority on product scope and MoSCoW priorities."],
        ["Scrum Master (SM)", "Agile Delivery Coach", "Facilitates Scrum ceremonies, clears technical impediments, tracks velocity.", "Authority over adherence to Agile processes and sprint time-boxes."],
        ["Lead Systems Architect", "Asman Makero Musa", "Engineers backend architecture, pgvector schemas, and AI RAG pipelines.", "Final decision on software architecture, ADRs, and security design."],
        ["Full-Stack Frontend Lead", "Senior React Engineer", "Engineers Next.js 14 App Router, UI components, and PDF viewer integration.", "Authority over client ergonomics, WCAG accessibility, and styling."],
        ["QA & DevOps Engineer", "Lead Quality Specialist", "Engineers CI/CD pipelines, Docker containers, Azure deployments, test suites.", "Quality gatekeeper: authority to reject builds failing test thresholds."],
    ]
    story.append(make_table(role_data[0], role_data[1:], [110, 90, 160, 144], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("4.0 WORK BREAKDOWN STRUCTURE (WBS) & 4-LEVEL DECOMPOSITION", styles['h1']))
    story.append(Paragraph("The system engineering scope is decomposed into four hierarchical levels (Program -> Subsystem -> Package -> Task):", styles['body']))

    wbs_data = [
        ["WBS Code", "Hierarchical Task Name", "Work Package Description", "Target Output Artifact"],
        ["1.0", "EduRAG Scholar Engineering", "Total project lifecycle and system deliverables.", "Fully verified production platform"],
        ["1.1", "Ingestion & Extraction Subsystem", "Text extraction, OCR, and document categorization.", "Functional extraction pipeline"],
        ["1.1.1", "PyMuPDF Document Parser", "Implement fitz text, page number, and spatial extraction.", "`extractor.py` module with 100% tests"],
        ["1.1.2", "Sliding-Window Token Chunker", "Implement 800-token chunker with 120-token overlap.", "`chunker.py` with boundary preservation"],
        ["1.1.3", "Supabase Storage CDN Upload", "Sync original binary PDFs to `course-documents` bucket.", "Public storage URLs mapped in database"],
        ["1.2", "Vector Embedding & Search Subsystem", "pgvector integration, HNSW indexing, and search RPC.", "Vector search engine"],
        ["1.2.1", "Gemini Batch Embedder", "Batch vectorization in clusters of 20 via Gemini API.", "`embedder.py` with 1536-dim verification"],
        ["1.2.2", "PostgreSQL pgvector Schema", "Implement tables, HNSW cosine index, and RPC function.", "`match_unit_chunks` SQL function"],
        ["1.2.3", "Unit Isolation Filter Engine", "Enforce strict unit boundary filtering on vector queries.", "Zero-leakage SQL query engine"],
        ["1.3", "Pedagogical & Active Recall Subsystem", "Professor Lecture Studio and SM-2 flashcard review.", "Interactive learning engines"],
        ["1.3.1", "Socratic Professor State Machine", "Implement 5-stage pedagogical loop with 3 hint levels.", "`professor_service.py` engine"],
        ["1.3.2", "SuperMemo-2 Scheduler", "Implement SM-2 interval and Easiness Factor algorithms.", "`spaced_repetition.py` module"],
        ["1.4", "Presentation & Client Subsystem", "Next.js 14 App Router and accessible UI components.", "Production web application"],
        ["1.4.1", "Centralized Academic Vault", "Build 3-shelf categorized vault with direct PDF opening.", "`AcademicVaultModal.tsx`"],
        ["1.4.2", "Direct Native PDF Viewer", "Integrate unconditional 'Open Real PDF' and iframe preview.", "`DocumentViewer.tsx`"],
        ["1.5", "DevOps & Infrastructure Subsystem", "CI/CD pipelines, containerization, and monitoring.", "Azure/Vercel production environment"],
    ]
    story.append(make_table(wbs_data[0], wbs_data[1:], [55, 140, 169, 140], styles))
    story.append(PageBreak())

    # 5. Section 5.0 & 6.0: Schedule and DoD
    story.append(Paragraph("5.0 MASTER PROJECT SCHEDULE & MILESTONE GANTT ROADMAP", styles['h1']))
    story.append(Paragraph("The 8-week production schedule distributed across four 2-week Agile Sprints:", styles['body']))

    sched_data = [
        ["Sprint ID", "Calendar Window", "Primary Focus & Epic Scope", "Major Milestone Deliverable"],
        ["Sprint 1", "Week 1 - Week 2", "Core Infrastructure & Ingestion Engine (PyMuPDF, Chunking, pgvector HNSW).", "M1: Document Ingestion Pipeline Operational"],
        ["Sprint 2", "Week 3 - Week 4", "RAG Retrieval Engine, Multi-Tier Fallback & Unit Isolation Architecture.", "M2: Sub-2.5s Verified RAG Synthesis Baseline"],
        ["Sprint 3", "Week 5 - Week 6", "Interactive Professor Studio, SM-2 Flashcards & Academic Vault UI.", "M3: Academic Vault & Socratic Studio Live"],
        ["Sprint 4", "Week 7 - Week 8", "End-to-End Testing, STRIDE Security Hardening, UAT & Handover.", "M4: Production Release v2.0 Enterprise Gold"],
    ]
    story.append(make_table(sched_data[0], sched_data[1:], [65, 95, 204, 140], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("5.1 Detailed Sprint Backlog Commitments & Ticket Breakdown", styles['h2']))
    story.append(Paragraph("The exact user story breakdown committed across each 2-week sprint:", styles['body']))

    sprint_detail = [
        ["Sprint / Week", "Backlog Ticket ID", "Feature / Deliverable Scope", "Story Pts", "Assigned Role", "Completion Criteria"],
        ["Sprint 1", "ENG-101", "PyMuPDF document extraction pipeline", "5", "Backend Dev", "Unit tests pass with 50-page PDF."],
        ["Sprint 1", "ENG-102", "Sliding-window token chunker implementation", "5", "Backend Dev", "800-token chunks with 15% overlap."],
        ["Sprint 1", "ENG-103", "Supabase pgvector HNSW schema & RPC", "8", "Lead Architect", "Sub-50ms vector search on 10,000 chunks."],
        ["Sprint 1", "ENG-104", "GitHub Actions CI/CD setup for Azure", "5", "DevOps Eng", "Automated deployment on push to main."],
        ["Sprint 2", "ENG-201", "RAGRouter multi-tier fallback orchestration", "8", "Lead Architect", "Seamless fallback to web agent on low score."],
        ["Sprint 2", "ENG-202", "Unit isolation filter validation", "5", "Backend Dev", "0% cross-unit chunk leakage."],
        ["Sprint 2", "ENG-203", "Next.js 14 App Router chat interface", "5", "Frontend Dev", "Streaming token response with SSE."],
        ["Sprint 2", "ENG-204", "Citation card rendering with slide links", "3", "Frontend Dev", "Clickable citations with exact page numbers."],
        ["Sprint 3", "ENG-301", "Professor Studio 5-stage pedagogical loop", "8", "Lead Architect", "Socratic questioning & progressive hints."],
        ["Sprint 3", "ENG-302", "SuperMemo-2 active recall engine", "5", "Backend Dev", "Accurate EF and interval recalculation."],
        ["Sprint 3", "ENG-303", "Centralized Academic Vault modal", "5", "Frontend Dev", "3-shelf categorization with direct PDF open."],
        ["Sprint 3", "ENG-304", "Supabase public storage bucket sync", "5", "DevOps Eng", "100% documents mapped to public URLs."],
        ["Sprint 4", "ENG-401", "Exhaustive functional & NFR testing suite", "8", "QA Specialist", "100% pass across all 13 test scripts."],
        ["Sprint 4", "ENG-402", "STRIDE security hardening & RLS audit", "5", "Lead Architect", "Zero cross-tenant data exposure."],
        ["Sprint 4", "ENG-403", "User Acceptance Testing with 25 students", "5", "Product Owner", "SUS score > 85; formal sign-off."],
    ]
    story.append(make_table(sprint_detail[0], sprint_detail[1:], [60, 65, 174, 45, 75, 85], styles))
    story.append(PageBreak())

    # 6. Section 6.0: Definition of Ready (DoR) & Definition of Done (DoD)
    story.append(Paragraph("6.0 DEFINITION OF READY (DoR) & DEFINITION OF DONE (DoD)", styles['h1']))
    story.append(Paragraph("Strict quality contracts governing backlog management and release readiness:", styles['body']))

    story.append(Paragraph("6.1 Definition of Ready (DoR) for Sprint Backlog Admission", styles['h2']))
    story.append(Paragraph("A user story is ready for sprint estimation and implementation only when: "
                           "<b>(1) Format:</b> Written in standard user story format ('As a [role], I want [capability] so that [benefit]'). "
                           "<b>(2) Acceptance Criteria:</b> Contains unambiguous Gherkin Given-When-Then scenarios. "
                           "<b>(3) Estimation:</b> Story point estimation agreed upon by team consensus (Fibonacci scale $\\le 8$ points). "
                           "<b>(4) Dependencies:</b> All external API keys and database schemas are identified and accessible.", styles['body']))

    story.append(Spacer(1, 6))
    story.append(Paragraph("6.2 Definition of Done (DoD) for Production Release", styles['h2']))
    story.append(Paragraph("A user story is certified Done and eligible for deployment only when: "
                           "<b>(1) Code Quality:</b> 100% peer-reviewed via Pull Request with zero unresolved review comments. "
                           "<b>(2) Test Coverage:</b> Accompanied by automated unit and integration tests maintaining $> 85\\%$ coverage. "
                           "<b>(3) Verification:</b> Verified against Gherkin acceptance criteria in the staging environment. "
                           "<b>(4) Security:</b> Scanned by Bandit and SonarQube with zero critical or high vulnerabilities. "
                           "<b>(5) Documentation:</b> API endpoints documented in OpenAPI Swagger; SDLC suite updated.", styles['body']))
    story.append(PageBreak())

    # 6. Section 7.0 & 8.0: GitFlow and Code Review
    story.append(Paragraph("7.0 SOURCE CONTROL, GITFLOW BRANCHING & COMMIT STANDARDS", styles['h1']))
    story.append(Paragraph(
        "Source code is maintained in GitHub under an enterprise GitFlow branching model: "
        "<b>`main` Branch:</b> Production-ready code; protected from direct commits; requires passing CI/CD and 1 peer review. "
        "<b>`develop` Branch:</b> Integration branch for active sprint development. "
        "<b>`feature/<ticket-id>-<slug>` Branches:</b> Isolated feature branches cut from `develop` and merged via Pull Request. "
        "<b>Commit Message Standard:</b> Follows Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("8.0 CODE REVIEW PROTOCOL, PAIR PROGRAMMING & CI GATES", styles['h1']))
    story.append(Paragraph("All code modifications must satisfy a rigorous four-stage review protocol:", styles['body']))

    cr_data = [
        ["Review Stage", "Inspection Mechanism", "Verification Tool", "Pass Gate Criteria"],
        ["Stage 1: Local Linting", "Static syntax and type check", "Flake8, Black, TypeScript `tsc`", "Zero syntax errors; 100% type safety."],
        ["Stage 2: Automated CI", "Automated test execution in GitHub Actions", "pytest, pytest-cov, Next.js build", "100% tests pass; coverage > 85%."],
        ["Stage 3: Security Scan", "Automated vulnerability audit", "Bandit, npm audit, SonarQube", "Zero critical/high vulnerabilities."],
        ["Stage 4: Peer Code Review", "Manual architectural & logic inspection", "GitHub Pull Request Review", "Approved by Lead Systems Architect."],
    ]
    story.append(make_table(cr_data[0], cr_data[1:], [110, 140, 134, 120], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("9.0 AGILE PROJECT METRICS: VELOCITY & BURN-DOWN TRACKING", styles['h1']))
    story.append(Paragraph(
        "Team productivity is measured via historical story point velocity. Based on the 4-engineer squad, planned velocity is "
        "established at <b>35 story points per 2-week sprint</b>. A daily burn-down chart tracks remaining points against the ideal "
        "linear burn line. Sprints exhibiting a divergence > 20% trigger an immediate emergency backlog reprioritization session.",
        styles['body']
    ))
    story.append(PageBreak())

    # 7. Section 10.0, 11.0, 12.0 & Signoff
    story.append(Paragraph("10.0 RISK MANAGEMENT & BLOCKER ESCALATION PROTOCOL", styles['h1']))
    story.append(Paragraph(
        "Blockers are resolved through an accelerated three-tier escalation ladder: "
        "<b>Tier 1 (Within Squad - 0 to 4 Hours):</b> Peer pairing between the blocked developer and Lead Systems Architect. "
        "<b>Tier 2 (Scrum Master Intervention - 4 to 24 Hours):</b> Removal of external dependency roadblocks (e.g., API quota increases). "
        "<b>Tier 3 (Steering Committee - 24+ Hours):</b> Formal scope adjustment or architectural trade-off review.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("11.0 CONTINUOUS PROCESS IMPROVEMENT & RETROSPECTIVE CADENCE", styles['h1']))
    story.append(Paragraph(
        "Every sprint concludes with a blameless 45-minute retrospective examining three questions: "
        "(1) What technical practices accelerated our delivery? (2) What tools or architectures introduced friction? "
        "(3) What concrete experiments will we commit to in the next sprint? Action items are logged as first-class backlog tickets.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("12.0 FORMAL SEMP CERTIFICATION & GOVERNANCE SIGN-OFF", styles['h1']))
    story.append(Paragraph("This Systems Engineering Management Plan is formally certified as the governing execution baseline.", styles['body']))

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
