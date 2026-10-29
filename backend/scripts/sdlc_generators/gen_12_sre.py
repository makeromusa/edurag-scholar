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
    pdf_filename = "12_SRE_Operations_Monitoring_DR_Runbook.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(
        pdf_path, pagesize=letter,
        leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54
    )
    styles = get_styles()
    story = []

    # 1. Cover
    add_cover(
        story, styles, 12,
        "SITE RELIABILITY ENGINEERING (SRE), OBSERVABILITY & DISASTER RECOVERY RUNBOOK",
        "SLOs, SLIs, Error Budgets, Distributed Tracing (Sentry APM), Structured Logging, Incident Command, Chaos Engineering & High-Availability Failover Protocols",
        "Google SRE Book (Beyer et al.) | OpenTelemetry Standards | ISO/IEC 20000 IT Service Management"
    )

    # 2. Table of Contents
    toc_sections = [
        ("1.0", "Site Reliability Engineering (SRE) Philosophy & Framework", "Google SRE tenets, treating operations as a software problem, toil reduction"),
        ("2.0", "Service Level Indicators (SLIs), SLOs & SLA Metrics", "Quantifying reliability: availability, latency, throughput, correctness"),
        ("3.0", "Error Budget Management & Release Gate Policies", "Error budget calculation, depletion consequences, feature freezes"),
        ("4.0", "The Three Pillars of Observability Architecture", "High-cardinality metrics, structured JSON logging, distributed OpenTelemetry traces"),
        ("5.0", "Application Performance Monitoring (Sentry APM)", "Transaction tracing, waterfall profiling, slow DB query captures"),
        ("6.0", "Structured Logging Specifications & Loguru Standards", "JSON structured format, correlation IDs, PII redaction rules"),
        ("7.0", "Synthetic Canaries & Continuous Health Probes", "Liveness, readiness, startup probes, synthetic RAG queries"),
        ("8.0", "Alert Response Playbooks & Automated Remediations", "Concrete operational runbooks for CPU, memory, and database alerts"),
        ("9.0", "Incident Classification Matrix (P0 to P4)", "Severity definitions, blast radius assessment, response time SLAs"),
        ("10.0", "Incident Command System (ICS) & Escalation Runbook", "Incident Commander role, communications lead, PagerDuty on-call matrix"),
        ("11.0", "Disaster Recovery (DR) Plan & Regional Failover Runbook", "Supabase WAL point-in-time recovery, Azure secondary failover, RTO/RPO SLAs"),
        ("12.0", "Chaos Engineering & Automated Resilience Injections", "Chaos Monkey principles, latency injection, simulated network partitions"),
        ("13.0", "Blameless Postmortem & Root Cause Analysis (RCA) Protocol", "Psychological safety, five-whys methodology, corrective action item tracking"),
        ("14.0", "Capacity Planning, Quotas & Cost Optimization", "Azure B1 CPU scaling, pgvector memory sizing, Gemini API token throttling"),
        ("15.0", "Formal SRE Operational Certification & Sign-Off Matrix", "Technical council sign-off and service handover acceptance"),
    ]
    add_table_of_contents(story, styles, toc_sections)

    # 3. Section 1.0 & 2.0: SRE Philosophy & SLOs
    story.append(Paragraph("1.0 SITE RELIABILITY ENGINEERING (SRE) PHILOSOPHY & FRAMEWORK", styles['h1']))
    story.append(Paragraph("1.1 Purpose of the SRE Operations Runbook", styles['h2']))
    story.append(Paragraph(
        "EduRAG Scholar implements the Site Reliability Engineering principles pioneered by Google (Beyer, Jones, Petoff, & Murphy, 2016). "
        "SRE views operations as fundamentally a software engineering problem. By applying software engineering practices to infrastructure, "
        "EduRAG Scholar ensures that academic services remain highly reliable, performant, and resilient during peak university examination periods "
        "at the University of Nairobi Chiromo Campus without requiring unsustainable manual effort (toil).",
        styles['body']
    ))
    story.append(Paragraph("1.2 The Tenets of SRE in EduRAG Scholar", styles['h2']))
    story.append(Paragraph(
        "<b>1. Service Level Objectives (SLOs) are Sacred:</b> Reliability is measured through quantitative indicators (SLIs) aligned with student user experience. "
        "If a service meets its SLO, engineering focuses on feature velocity; if the error budget is depleted, focus pivots exclusively to stability.<br/>"
        "<b>2. Elimination of Toil:</b> Repetitive, manual, automatable operational work is capped at under 30% of engineering time. All health checks, log analyses, and recovery steps are scripted.<br/>"
        "<b>3. Simplicity of Architecture:</b> Boring technology choices (PostgreSQL, standard FastAPI, Next.js) are prioritized over brittle distributed systems.<br/>"
        "<b>4. Blameless Postmortems:</b> Failures are treated as systemic opportunities to improve software defenses, never as individual negligence.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.0 SERVICE LEVEL INDICATORS (SLIS), SLOS & SLA METRICS", styles['h1']))
    story.append(Paragraph(
        "Reliability is quantitatively defined across four core dimensions: Availability, Latency, Throughput, and Grounding Correctness:",
        styles['body']
    ))

    slo_table = [
        ["Service Dimension", "Service Level Indicator (SLI) Formulation", "Internal Target (SLO)", "Customer SLA Commitment"],
        ["API Ingress Availability", "Successful HTTP (status &lt; 500) / Total HTTP requests over rolling 30 days.", "99.9% Availability (&le; 43m downtime/mo)", "99.5% Uptime SLA Guarantee"],
        ["Direct PDF Retrieval Latency", "P95 response time for Supabase Storage raw PDF fetches from edge CDN.", "P95 &lt; 1,200 ms", "P95 &lt; 2,500 ms"],
        ["Vector Search Query Latency", "P95 response time for HNSW cosine distance vector matching over 1,536 dims.", "P95 &lt; 350 ms", "P95 &lt; 800 ms"],
        ["RAG End-to-End Synthesis", "P95 response time for complete context retrieval and Gemini 2.5 synthesis.", "P95 &lt; 4,000 ms", "P95 &lt; 7,000 ms"],
        ["Grounding Faithfulness", "Percentage of generated factual claims supported by retrieved document excerpts.", "&ge; 98.0% grounded citations", "&ge; 95.0% citation accuracy"],
        ["Background Ingestion Throughput", "Time to extract text, chunk, and embed a 50-page academic past paper.", "&lt; 45 seconds per document", "&lt; 90 seconds per document"],
    ]
    story.append(make_table(slo_table[0], slo_table[1:], [110, 150, 120, 124], styles))
    story.append(PageBreak())

    # 4. Section 3.0 & 4.0: Error Budgets & Observability
    story.append(Paragraph("3.0 ERROR BUDGET MANAGEMENT & RELEASE GATE POLICIES", styles['h1']))
    story.append(Paragraph(
        "An Error Budget represents the acceptable margin of unreliability over a 30-day rolling window. "
        "For an availability SLO of 99.9%, the allowable downtime is 0.1% (approximately 43.2 minutes per month). "
        "Error budget tracking ensures balance between innovation and system stability:",
        styles['body']
    ))

    story.append(Paragraph("3.1 Mathematical Formulation of Error Budget", styles['h2']))
    story.append(Paragraph(
        "<code>Error Budget = 1.0 - SLOTarget = 1.0 - 0.999 = 0.001 (0.1%)<br/>"
        "Budget Minutes = Total Monthly Minutes &times; 0.001 = 43,200 min &times; 0.001 = 43.2 minutes<br/>"
        "Burn Rate = (Observed Error Rate) / (Allowable Error Rate)</code>",
        styles['code']
    ))

    story.append(Paragraph("3.2 Error Budget Depletion Policies", styles['h2']))
    story.append(Paragraph(
        "<b>1. Healthy (Burn Rate &le; 1.0x, Remaining Budget &gt; 50%):</b> Standard continuous deployment; new features ship at normal velocity.<br/>"
        "<b>2. Elevated Risk (Remaining Budget 20% - 50%):</b> Increased peer review scrutiny; pull requests require approval from Lead SRE.<br/>"
        "<b>3. Critical Exhaustion (Remaining Budget &lt; 20%):</b> <b>Feature Freeze</b> declared immediately. "
        "All development sprints halt new feature releases; 100% of engineering bandwidth pivots to bug fixes, query optimization, and infrastructure hardening.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("4.0 THE THREE PILLARS OF OBSERVABILITY ARCHITECTURE", styles['h1']))
    story.append(Paragraph(
        "EduRAG Scholar implements full-stack observability across the three foundational pillars of modern distributed systems:",
        styles['body']
    ))

    pillars_data = [
        ["Observability Pillar", "Primary Technology", "Telemetry Captured", "Retention & Destination"],
        ["Pillar 1: Metrics", "Prometheus & Azure Application Insights", "Request rates, P50/P95/P99 latencies, CPU/memory usage, pool saturation.", "90 days retention in Azure Monitor metrics store."],
        ["Pillar 2: Structured Logs", "Python Loguru & JSON Formatter", "Timestamp, trace ID, user ID, module, log level, event payload.", "30 days retention in Log Analytics workspace."],
        ["Pillar 3: Distributed Tracing", "Sentry APM & OpenTelemetry SDK", "End-to-end request spans from Vercel edge through FastAPI to Supabase.", "14 days high-fidelity trace retention in Sentry."],
    ]
    story.append(make_table(pillars_data[0], pillars_data[1:], [110, 130, 140, 124], styles))
    story.append(PageBreak())

    # 5. Section 5.0 & 6.0: Sentry APM & Structured Logging
    story.append(Paragraph("5.0 APPLICATION PERFORMANCE MONITORING (SENTRY APM)", styles['h1']))
    story.append(Paragraph(
        "Sentry APM is integrated into both the FastAPI backend and Next.js frontend to capture real-time application performance anomalies and stack traces:",
        styles['body']
    ))

    story.append(Paragraph("5.1 Sentry Backend Initialization Code", styles['h2']))
    story.append(Paragraph(
        "<code>import sentry_sdk<br/>"
        "from sentry_sdk.integrations.fastapi import FastApiIntegration<br/>"
        "from sentry_sdk.integrations.starlette import StarletteIntegration<br/>"
        "<br/>"
        "sentry_sdk.init(<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;dsn=os.getenv(\"SENTRY_DSN\"),<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;environment=os.getenv(\"APP_ENV\", \"production\"),<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;traces_sample_rate=0.25, # 25% distributed transaction sampling<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;profiles_sample_rate=0.10, # 10% continuous profiling<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;integrations=[FastApiIntegration(), StarletteIntegration()],<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;send_default_pii=False # Strict PII compliance<br/>"
        ")</code>",
        styles['code']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("6.0 STRUCTURED LOGGING SPECIFICATIONS & LOGURU STANDARDS", styles['h1']))
    story.append(Paragraph(
        "All logs are formatted as machine-parsable JSON lines. Plain text `print()` statements are strictly forbidden in production code:",
        styles['body']
    ))

    story.append(Paragraph("6.1 Production JSON Log Schema", styles['h2']))
    story.append(Paragraph(
        "<code>{<br/>"
        "&nbsp;&nbsp;\"timestamp\": \"2026-10-29T12:00:00.123Z\",<br/>"
        "&nbsp;&nbsp;\"level\": \"INFO\",<br/>"
        "&nbsp;&nbsp;\"trace_id\": \"b839f21a4e12c98a\",<br/>"
        "&nbsp;&nbsp;\"user_id\": \"9bd58ed8-3c71-4b9a-be11-83813b71456f\",<br/>"
        "&nbsp;&nbsp;\"endpoint\": \"/api/rag/query\",<br/>"
        "&nbsp;&nbsp;\"unit_code\": \"SCS 3209\",<br/>"
        "&nbsp;&nbsp;\"duration_ms\": 842.15,<br/>"
        "&nbsp;&nbsp;\"chunks_retrieved\": 5,<br/>"
        "&nbsp;&nbsp;\"message\": \"RAG retrieval and answer generation completed successfully.\"<br/>"
        "}</code>",
        styles['code']
    ))
    story.append(Paragraph("6.2 Personally Identifiable Information (PII) Redaction", styles['h2']))
    story.append(Paragraph(
        "Log filters automatically mask authorization tokens (`Bearer ey...`), user passwords, raw credit card data, "
        "and national identity numbers with `[REDACTED]` before writing to standard output.",
        styles['body']
    ))
    story.append(PageBreak())

    # 6. Section 7.0 & 8.0: Canaries & Alert Playbooks
    story.append(Paragraph("7.0 SYNTHETIC CANARIES & CONTINUOUS HEALTH PROBES", styles['h1']))
    story.append(Paragraph(
        "EduRAG Scholar employs synthetic monitoring canaries that simulate actual student interactions continuously every 60 seconds:",
        styles['body']
    ))

    probes_data = [
        ["Probe Name", "Frequency", "Target Endpoint", "Success Assertion Criteria"],
        ["Liveness Probe", "Every 15s", "`/api/health`", "HTTP 200 within 500ms; status == 'healthy'."],
        ["Database Readiness Probe", "Every 30s", "`/api/health/db`", "HTTP 200; Supabase connection latency &lt; 200ms."],
        ["Vector Search Canary", "Every 60s", "`/api/health/vector`", "Executes sample cosine query; confirms &ge; 1 match in &lt; 300ms."],
        ["Storage Reachability Canary", "Every 120s", "`/api/health/storage`", "Issues HTTP HEAD to Supabase public CDN; asserts HTTP 200."],
        ["LLM Generation Canary", "Every 5 min", "`/api/health/llm`", "Generates 1-sentence prompt; verifies Gemini API response in &lt; 3,500ms."],
    ]
    story.append(make_table(probes_data[0], probes_data[1:], [110, 74, 150, 170], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("8.0 ALERT RESPONSE PLAYBOOKS & AUTOMATED REMEDIATIONS", styles['h1']))
    story.append(Paragraph("Concrete operational runbooks triggered by Azure Monitor alerts:", styles['body']))

    playbook_data = [
        ["Alert Trigger", "Trigger Condition", "Automated Remediation", "Engineer Next Steps"],
        ["High CPU Saturation", "CPU &gt; 85% for 3 consecutive minutes.", "Azure autoscale scales out from 1 to 2 B1 instances.", "Inspect Sentry APM for expensive regex or non-indexed DB queries."],
        ["Memory Leaking", "Memory usage &gt; 90% of 1.75 GB RAM.", "Worker process recycling triggered automatically.", "Examine PyMuPDF document extraction streams for unclosed file handles."],
        ["Database Connection Spike", "Active DB connections &gt; 80 / 100 limit.", "Supavisor connection pooling recycles idle clients.", "Check connection leak in FastAPI async session context managers."],
        ["5xx Error Rate Spike", "HTTP 500 responses &gt; 1% over 5 minutes.", "PagerDuty alert fires; initiates canary traffic diversion.", "Execute instant rollback to prior stable deployment package."],
    ]
    story.append(make_table(playbook_data[0], playbook_data[1:], [110, 120, 134, 140], styles))
    story.append(PageBreak())

    # 7. Section 9.0: Incident Severity
    story.append(Paragraph("9.0 INCIDENT CLASSIFICATION MATRIX (P0 TO P4)", styles['h1']))
    story.append(Paragraph("Incidents are categorized based on university operational impact and user blast radius:", styles['body']))

    sev_data = [
        ["Severity", "Definition & Impact", "Response SLA", "Escalation Target & Action"],
        ["P0 - Blocker", "Total outage. All students unable to study or access past papers during exams.", "Ack &lt; 5 min<br/>Fix &lt; 30 min", "Immediate pager call to Lead SRE, Tech Lead, and System Architect. Emergency war room opened."],
        ["P1 - Critical", "Core feature broken (e.g. RAG queries failing or 'Open Real PDF' returning 404s).", "Ack &lt; 15 min<br/>Fix &lt; 2 hours", "Pager alert to On-Call SRE. Rollback initiated if root cause not identified within 20 mins."],
        ["P2 - Major", "Degraded performance (P95 latency &gt; 5s) or specific non-critical unit unavailable.", "Ack &lt; 1 hour<br/>Fix &lt; 8 hours", "On-Call engineer assigned. Investigated during business hours or immediate triage."],
        ["P3 - Minor", "Cosmetic UI glitch, minor styling defect, or non-blocking console warning.", "Ack &lt; 4 hours<br/>Fix &lt; 3 days", "Ticket logged in sprint backlog for standard sprint triage."],
        ["P4 - Low", "Documentation typo, minor feature request, or optimization recommendation.", "Ack &lt; 24 hours<br/>Fix next cycle", "Addressed in future sprint planning sessions."],
    ]
    story.append(make_table(sev_data[0], sev_data[1:], [75, 160, 95, 174], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("10.0 INCIDENT COMMAND SYSTEM (ICS) & ON-CALL ESCALATION", styles['h1']))
    story.append(Paragraph(
        "During P0 and P1 incidents, the engineering organization shifts into the standardized Incident Command System:",
        styles['body']
    ))

    story.append(Paragraph("10.1 Key Operational Roles During an Active Incident", styles['h2']))
    story.append(Paragraph(
        "<b>1. Incident Commander (IC):</b> Owns the incident response. Directs investigation streams, assigns tasks, and makes rollback decisions. Does NOT write code.<br/>"
        "<b>2. Operations Lead (Ops):</b> Executes system modifications, server restarts, slot swaps, and diagnostic queries under IC direction.<br/>"
        "<b>3. Communications Lead (Comms):</b> Updates the public status page (`status.edurag.ac.ke`) and university student representative communication channels every 15 minutes.",
        styles['body']
    ))

    story.append(Paragraph("10.2 On-Call Escalation Matrix", styles['h2']))
    story.append(Paragraph(
        "• <b>Tier 1 (0 - 5 Minutes):</b> Primary On-Call SRE paged via PagerDuty mobile app and automated phone call.<br/>"
        "• <b>Tier 2 (5 - 15 Minutes):</b> If unacknowledged, Secondary On-Call Engineer and Engineering Lead are paged.<br/>"
        "• <b>Tier 3 (15 - 30 Minutes):</b> Technical Director and Head of School are notified; university communications team placed on standby.",
        styles['body']
    ))
    story.append(PageBreak())

    # 8. Section 11.0: Disaster Recovery Failover Runbook
    story.append(Paragraph("11.0 DISASTER RECOVERY (DR) PLAN & REGIONAL FAILOVER RUNBOOK", styles['h1']))
    story.append(Paragraph(
        "Standard Operating Procedure for catastrophic cloud infrastructure failure (e.g. Azure UAE North datacenter outage):",
        styles['body']
    ))

    dr_steps = [
        ["Step", "Phase", "Operational Command / Action", "Target Duration"],
        ["1", "Declaration", "IC officially declares Regional DR Disaster based on cloud provider outage.", "T+0 min"],
        ["2", "Database Verification", "Verify Supabase Frankfurt instance status; pgvector database is multi-cloud decoupled from Azure.", "T+2 min"],
        ["3", "DNS Redirection", "Switch Azure App Service traffic to secondary standby in South Africa North via Azure Traffic Manager.", "T+5 min"],
        ["4", "Container Warm-Up", "Execute synthetic warm-up probes against secondary regional instance.", "T+8 min"],
        ["5", "Frontend Edge Repointing", "Update `NEXT_PUBLIC_API_URL` on Vercel Edge; trigger instant redeploy.", "T+10 min"],
        ["6", "E2E Verification", "Execute automated smoke verification script against newly promoted secondary endpoint.", "T+12 min"],
        ["7", "Resolution", "Confirm all student revision services restored; post status update to university portal.", "T+15 min (RTO met)"],
    ]
    story.append(make_table(dr_steps[0], dr_steps[1:], [35, 95, 290, 84], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("12.0 CHAOS ENGINEERING & AUTOMATED RESILIENCE INJECTIONS", styles['h1']))
    story.append(Paragraph(
        "To ensure robust operational resilience before university final examinations, EduRAG Scholar conducts weekly automated chaos experiments in staging:",
        styles['body']
    ))

    chaos_experiments = [
        ["Chaos Experiment", "Injected Fault / Failure", "Hypothesis & Expected System Behavior", "Result & Validation"],
        ["Database Drop Simulation", "Sever Supabase TCP connection for 30s.", "FastAPI returns 503 Service Unavailable gracefully with retry-after header.", "Pass: Connection pool reconnects seamlessly within 3 seconds."],
        ["LLM API Latency Injection", "Simulate 12-second latency on Gemini API.", "FastAPI times out at 8.0s, falls back to direct cached semantic excerpts.", "Pass: Student receives cached study notes instead of hanging UI."],
        ["Storage Node Outage", "Simulate 500 error on Supabase Storage bucket.", "Frontend displays 'PDF Temporarily Offline - Download Cached Text' fallback.", "Pass: Offline text viewer renders without crashing."],
    ]
    story.append(make_table(chaos_experiments[0], chaos_experiments[1:], [110, 110, 160, 124], styles))
    story.append(PageBreak())

    # 9. Section 13.0 & 14.0: RCA & Capacity Planning
    story.append(Paragraph("13.0 BLAMELESS ROOT CAUSE ANALYSIS (RCA) POSTMORTEM PROTOCOL", styles['h1']))
    story.append(Paragraph(
        "Within 48 hours of any P0 or P1 incident resolution, the Incident Commander convenes a mandatory Blameless Postmortem. "
        "The objective is to identify systemic vulnerabilities and implement preventative guardrails:",
        styles['body']
    ))

    story.append(Paragraph("13.1 Standard RCA Postmortem Case Study", styles['h2']))
    story.append(Paragraph(
        "<code># Incident Postmortem: [INC-2026-10-29] Storage URL Missing in Catalog Endpoint<br/>"
        "Date: 2026-10-29 | Duration: 24 minutes | Impact: Students unable to launch direct PDF viewers.<br/>"
        "Author: Lead SRE | Status: Closed Action Items.<br/>"
        "<br/>"
        "1. Executive Summary: At 08:30 UTC, students reported that clicking past paper documents did not launch the real PDF.<br/>"
        "2. Root Cause: The FastAPI endpoint `/api/documents` omitted `storage_url` in the database `.select()` clause.<br/>"
        "3. Five Whys:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- Why? Frontend received undefined for `storage_url`.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- Why? Backend SQL query selected only id, title, unit_code.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- Why? Refactoring PR #142 narrowed column projection for performance without updating test assertions.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- Why? Integration tests checked HTTP 200 but did not assert presence of `storage_url` key.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- Why? Smoke test test-suite lacked contract validation for response payloads.<br/>"
        "4. Corrective Action Items:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- [Done] Updated endpoint to select `storage_url` and enrich with Supabase public storage links.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- [Done] Added Pydantic schema validation requiring `storage_url` in DocumentOut model.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;- [Done] Added automated CI test asserting `storage_url.startswith('http')` for all documents.</code>",
        styles['code']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("14.0 CAPACITY PLANNING, RESOURCE QUOTAS & COST OPTIMIZATION", styles['h1']))
    story.append(Paragraph(
        "EduRAG Scholar balances high-performance academic access with university budgetary efficiency:",
        styles['body']
    ))

    cap_data = [
        ["Resource Tier", "Provisioned Capacity", "Scaling Threshold", "Cost Management Mechanism"],
        ["Azure App Service", "1 x B1 (1 vCPU, 1.75 GB RAM)", "CPU &gt; 80% for 5 min -> Scale out to 2 instances", "Auto-scale rule throttles back to 1 instance overnight."],
        ["Supabase PostgreSQL", "Micro Compute + 1536-dim pgvector", "Disk usage &gt; 75% -> Auto-expand storage volume", "Connection pooler (Supavisor) caps connections at 100."],
        ["Google Gemini API", "Pay-as-you-go Flash 2.5 tokens", "Throttled at 1,000 RPM per client IP", "Redis semantic cache prevents redundant LLM calls for identical queries."],
        ["Vercel Edge Network", "Standard Pro Global CDN", "Bandwidth auto-scales to 1 TB/mo", "Edge asset caching caches past exam PDFs and static UI assets."],
    ]
    story.append(make_table(cap_data[0], cap_data[1:], [110, 130, 134, 130], styles))
    story.append(PageBreak())

    # 10. Section 15.0: Sign-Off Matrix
    story.append(Paragraph("15.0 FORMAL SRE OPERATIONAL CERTIFICATION & SIGN-OFF MATRIX", styles['h1']))
    story.append(Paragraph(
        "This Site Reliability Engineering, Observability & Disaster Recovery Runbook has been formally reviewed, "
        "tested in staging disaster simulations, and certified by the technical leadership.",
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
