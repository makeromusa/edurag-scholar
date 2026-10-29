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
    pdf_filename = "05_HLD_High_Level_Design.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(
        pdf_path, pagesize=letter,
        leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54
    )
    styles = get_styles()
    story = []

    # 1. Cover
    add_cover(
        story, styles, 5,
        "HIGH-LEVEL DESIGN SPECIFICATION (HLD)",
        "System Subsystem Decomposition, Cloud Infrastructure Topology & End-to-End Dynamic Workflows",
        "IEEE Std 1016-2009 / ISO/IEC/IEEE 42010 | Kendall & Kendall Ch 16: Systems Design"
    )

    # 2. Table of Contents
    toc_sections = [
        ("1.0", "Introduction, Purpose & Design Context", "HLD scope, relationship to SAD and SRS, engineering goals"),
        ("2.0", "Subsystem Decomposition & Component Topology", "Detailed breakdown of the 6 core functional subsystems"),
        ("3.0", "Inter-Subsystem Communication & API Contracts", "REST endpoints, payload schemas, header authentication"),
        ("4.0", "Data Interchange Formats & JSON Schema Specifications", "Formal schemas for Citations, Documents, and Socratic sessions"),
        ("5.0", "End-to-End Dynamic Workflow Architecture", "Document Ingestion and Lecture Studio execution sequence traces"),
        ("6.0", "Cloud Infrastructure Topology & Network Blueprint", "Azure UAE North, Supabase EU, Vercel Edge, MongoDB Atlas"),
        ("7.0", "Data Storage Architecture & Hybrid Partitioning", "PostgreSQL pgvector, MongoDB BSON, Supabase Storage CDN"),
        ("8.0", "System Scalability, Elasticity & Throughput Design", "Connection pooling, thread offloading, horizontal container scale"),
        ("9.0", "High-Availability, Fault Tolerance & Disaster Recovery", "RTO < 15m, RPO < 5m, multi-tier failover mechanics"),
        ("10.0", "Security Architecture & Perimeter Defense", "Zero trust, JWT validation, RLS data isolation, TLS 1.3"),
        ("11.0", "Observability, Telemetry & Health Checks", "Sentry APM, structured JSON logging, synthetic endpoint probing"),
        ("12.0", "Formal Design Review & Governance Sign-Off", "Review board approvals and technical council acceptance"),
    ]
    add_table_of_contents(story, styles, toc_sections)

    # 3. Section 1.0 & 2.0
    story.append(Paragraph("1.0 INTRODUCTION, PURPOSE & DESIGN CONTEXT", styles['h1']))
    story.append(Paragraph("1.1 Purpose of the High-Level Design", styles['h2']))
    story.append(Paragraph(
        "The High-Level Design (HLD) specification translates the logical architecture defined in the Software Architecture Document (SAD) "
        "and the functional requirements of the Software Requirements Specification (SRS) into concrete subsystem blueprints. "
        "In conformance with IEEE Std 1016-2009 (Standard for Information Technology &mdash; Systems Design &mdash; Software Design Descriptions), "
        "this document details the functional responsibilities, public interfaces, network topologies, and data flow mechanisms across all "
        "subsystems comprising EduRAG Scholar.",
        styles['body']
    ))
    story.append(Paragraph("1.2 Design Philosophy & Core Principles", styles['h2']))
    story.append(Paragraph(
        "The high-level design is guided by four foundational engineering principles: "
        "<b>(1) Strict Separation of Concerns (SoC):</b> Ingestion, retrieval, presentation, and persistence operate as decoupled modules. "
        "<b>(2) Asynchronous Non-Blocking Execution:</b> All expensive operations (PDF parsing, LLM generation) execute asynchronously to maintain snappy client interaction. "
        "<b>(3) Direct Storage Offloading:</b> Large binary document transfers bypass backend RAM via direct CDN storage links. "
        "<b>(4) Epistemic Determinism:</b> Vector queries strictly enforce curriculum isolation to prevent hallucinated cross-unit leakage.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.0 SUBSYSTEM DECOMPOSITION & COMPONENT TOPOLOGY", styles['h1']))
    story.append(Paragraph("EduRAG Scholar is decomposed into six cohesive subsystems:", styles['body']))

    subsystem_data = [
        ["Subsystem Identifier", "Primary Component Name", "Core Technical Responsibilities", "Internal Module Linkage"],
        ["SS-01: Ingestion Engine", "ExtractionPipeline & Chunker", "Extracts text from PDF/OCR; chunks text with 15% overlap; uploads PDF to storage.", "Calls PyMuPDF (fitz), Supabase Storage client."],
        ["SS-02: Vectorization Engine", "EmbeddingService", "Generates 1,536-dim vector embeddings via Gemini API; batches into clusters of 20.", "Calls Google GenAI SDK, writes to PostgreSQL."],
        ["SS-03: Retrieval Engine", "RAGRouter & SearchEngine", "Executes unit-isolated cosine similarity query; filters by 0.68 threshold; reranks.", "Queries Supabase `match_unit_chunks` RPC."],
        ["SS-04: Synthesis Engine", "SynthesisService & Formatter", "Assembles grounded prompt; streams LLM tokens; constructs citation cards.", "Calls Gemini 1.5 Flash API, formats SSE stream."],
        ["SS-05: Socratic Studio", "ProfessorService", "Executes 5-stage pedagogical state loop; provides 3-tier hints; logs concept errors.", "Interacts with MongoDB weakness registry."],
        ["SS-06: Academic Vault", "AcademicVaultController", "Categorizes documents into books, exams, formulas; serves direct PDF URLs.", "Interfaces with Supabase `documents` table and CDN."],
    ]
    story.append(make_table(subsystem_data[0], subsystem_data[1:], [110, 120, 164, 110], styles))
    story.append(PageBreak())

    # 4. Section 3.0: Inter-Subsystem Communication & API Contracts
    story.append(Paragraph("3.0 INTER-SUBSYSTEM COMMUNICATION & API CONTRACTS", styles['h1']))
    story.append(Paragraph("The subsystems communicate through well-defined, RESTful API contracts utilizing JSON payloads over HTTPS:", styles['body']))

    api_contracts = [
        ["HTTP Route", "Method", "Request Payload Schema", "Response Payload Schema", "SLA Target"],
        ["/api/chat", "POST", "{ unit_code: str, query: str, session_id?: str, threshold?: float }", "{ answer: str, citations: Citation[], session_id: str }", "< 2,500ms"],
        ["/api/documents", "GET", "Query param: unit_code: str (Optional)", "{ documents: IngestedDoc[] (with storage_url) }", "< 150ms"],
        ["/api/documents/upload", "POST", "Multipart form: file: UploadFile, unit_code: str", "{ id: str, status: 'indexed', page_count: int, chunks: int }", "< 45,000ms"],
        ["/api/documents/{id}/raw", "GET", "Path param: id: str", "HTTP 307 Redirect -> Public Supabase Storage URL", "< 100ms"],
        ["/api/professor/teach", "POST", "{ unit_code: str, document_id: str, stage: int, response?: str }", "{ prompt: str, stage: int, score?: int, hints: str[] }", "< 1,800ms"],
        ["/api/flashcards/review", "POST", "{ card_id: str, quality: int (0..5) }", "{ card_id: str, next_review: str, interval: int, ef: float }", "< 80ms"],
    ]
    story.append(make_table(api_contracts[0], api_contracts[1:], [110, 50, 160, 140, 44], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("3.1 Security & Header Authentication Specifications", styles['h2']))
    story.append(Paragraph(
        "All mutating API routes (upload, delete, weakness logging, chat session persistence) require an `Authorization: Bearer <JWT>` header. "
        "The FastAPI security dependency `get_user_from_header` intercepts incoming requests, verifies the cryptographic signature against "
        "the Supabase GoTrue public key, extracts the authenticated `user_id`, and enforces tenant isolation. Unauthenticated preview requests "
        "are permitted strictly for shared public course materials (`uploaded_by IS NULL`).",
        styles['body']
    ))
    story.append(PageBreak())

    # Section 4.0: Schemas
    story.append(Paragraph("4.0 DATA INTERCHANGE FORMATS & JSON SCHEMA SPECIFICATIONS", styles['h1']))
    story.append(Paragraph(
        "To guarantee contract stability between the Next.js frontend and the FastAPI backend, the following schemas are strictly enforced:",
        styles['body']
    ))
    story.append(Paragraph("4.1 Citation Payload Schema", styles['h2']))
    story.append(Paragraph("<code>{\n"
                           "  \"type\": \"local_slide\" | \"web\",\n"
                           "  \"unit_code\": \"SCS 3207\",\n"
                           "  \"file_name\": \"os_merged slides.pdf\",\n"
                           "  \"page_number\": 42,\n"
                           "  \"slide_title\": \"Peterson's Algorithm Mutual Exclusion Proof\",\n"
                           "  \"content_preview\": \"flag[i] = true; turn = j; while(flag[j] && turn == j);\",\n"
                           "  \"storage_url\": \"https://xccrkalsujefsghtuirp.supabase.co/storage/v1/object/public/course-documents/os_merged%20slides.pdf\"\n"
                           "}</code>", styles['code']))

    story.append(Paragraph("4.2 Academic Vault Ingested Document Metadata Schema", styles['h2']))
    story.append(Paragraph("<code>{\n"
                           "  \"id\": \"50d180ce-016f-4b7f-9eed-352aae8b41aa\",\n"
                           "  \"unit_code\": \"SCS 3207\",\n"
                           "  \"title\": \"2026.01.26_SCS3207_Operating Systems_EXAM.pdf\",\n"
                           "  \"page_count\": 4,\n"
                           "  \"chunks_indexed\": 4,\n"
                           "  \"is_processed\": true,\n"
                           "  \"category\": \"exam\",\n"
                           "  \"storage_url\": \"https://xccrkalsujefsghtuirp.supabase.co/storage/v1/object/public/course-documents/2026.01.26_SCS3207_Operating%20Systems_EXAM.pdf\"\n"
                           "}</code>", styles['code']))

    story.append(Paragraph("4.3 Socratic Professor Studio State Schema", styles['h2']))
    story.append(Paragraph("<code>{\n"
                           "  \"session_id\": \"sess_8f3a129c\",\n"
                           "  \"unit_code\": \"SCS 3201\",\n"
                           "  \"stage\": 2,\n"
                           "  \"stage_name\": \"Socratic Questioning & Edge Cases\",\n"
                           "  \"prompt\": \"In a DFD Level 1, what occurs if data flows directly between two data stores?\",\n"
                           "  \"available_hints\": [\"Consider who initiates the data movement\", \"Data stores are passive entities\"],\n"
                           "  \"score\": 85\n"
                           "}</code>", styles['code']))
    story.append(PageBreak())

    # 5. Section 5.0: End-to-End Dynamic Workflow Architecture
    story.append(Paragraph("5.0 END-TO-END DYNAMIC WORKFLOW ARCHITECTURE", styles['h1']))
    story.append(Paragraph("Detailed sequence execution traces modeling asynchronous multi-subsystem collaboration:", styles['body']))

    add_diagram(story, styles, "sequence_ingestion.png", "UML Sequence Diagram &mdash; High-Throughput Document Ingestion & Vector Indexing", width=6.2, height=3.3)

    story.append(Paragraph("5.1 Narrative Analysis of Document Ingestion Sequence", styles['h2']))
    story.append(Paragraph(
        "<b>1. File Upload:</b> Client transmits multi-part binary PDF to `POST /api/documents/upload`. "
        "<b>2. Asynchronous Thread Handoff:</b> FastAPI saves file temporarily, creates a `documents` database record with `is_processed=false`, "
        "and spawns an asynchronous worker thread via `ThreadPoolExecutor`. "
        "<b>3. PyMuPDF Page Extraction:</b> Worker extracts raw text, page numbers, and bounding boxes across all pages. "
        "<b>4. Sliding-Window Chunking:</b> Chunker generates 800-token chunks with 120-token overlap, tagging each chunk with page metadata. "
        "<b>5. Storage CDN Upload:</b> Concurrently, the original binary PDF is uploaded to Supabase Storage bucket `course-documents`. The public storage URL is generated and saved. "
        "<b>6. Batch Vectorization:</b> Chunks are batched in groups of 20 and submitted to Gemini `embedding-001`, returning 1,536-dim vectors. "
        "<b>7. HNSW Indexing:</b> Chunks and vectors are inserted into PostgreSQL `document_chunks`. The parent record is updated to `is_processed=true`.",
        styles['body']
    ))

    add_diagram(story, styles, "sequence_lecture_studio.png", "UML Sequence Diagram &mdash; Interactive Socratic Professor Lecture Studio", width=6.2, height=3.3)

    story.append(Paragraph("5.2 Narrative Analysis of Lecture Studio Sequence", styles['h2']))
    story.append(Paragraph(
        "<b>1. Studio Initialization:</b> Student selects a document and clicks 'Teach in Studio'. Client dispatches `POST /api/professor/teach`. "
        "<b>2. Socratic Deconstruction:</b> Professor agent extracts primary concept chunk and formulates an intuitive real-world analogy and Socratic question. "
        "<b>3. Student Evaluation:</b> Student submits reasoning. Professor agent analyzes response against rubric criteria: if comprehension is confirmed, "
        "it advances to Stage 1 (Mathematical Rigor). If a misconception is detected, it triggers Level 1 Scaffolding hint without giving away the final answer. "
        "<b>4. State Persistence:</b> Interaction trace and diagnosed weakness metrics are logged to MongoDB Atlas.",
        styles['body']
    ))
    story.append(PageBreak())

    # 6. Section 6.0 & 7.0: Cloud Infrastructure & Storage
    story.append(Paragraph("6.0 CLOUD INFRASTRUCTURE TOPOLOGY & NETWORK BLUEPRINT", styles['h1']))
    story.append(Paragraph(
        "EduRAG Scholar is distributed across premier cloud infrastructure to balance low latency, high availability, and cost efficiency: "
        "<b>(1) Azure App Service (UAE North):</b> Hosts the Python FastAPI backend in a managed Docker Linux container. The UAE North region "
        "was strategically selected to achieve direct undersea fiber routing to Kenya, delivering ping latencies under 70ms to Nairobi students. "
        "<b>(2) Vercel Anycast Edge Network:</b> Distributes the Next.js React frontend across worldwide edge caches, serving static HTML and JS in under 50ms. "
        "<b>(3) Supabase Cloud Managed PostgreSQL (Frankfurt):</b> Hosts the relational database and pgvector extension, protected by automatic daily backups. "
        "<b>(4) MongoDB Atlas Multi-Cloud Cluster:</b> Manages distributed NoSQL chat transcripts and spaced repetition review states.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("7.0 DATA STORAGE ARCHITECTURE & HYBRID PARTITIONING", styles['h1']))
    story.append(Paragraph("A clear partitioning model separates relational, vector, document, and binary object data:", styles['body']))

    storage_table = [
        ["Data Domain / Artifact", "Storage Engine", "Schema Structure", "Partitioning / Isolation Mechanism"],
        ["Document Metadata & Page Counts", "Supabase PostgreSQL", "Relational `documents` table (UUID PK)", "Unit-code indexed; tenant isolated via `uploaded_by`."],
        ["Vector Embeddings (1536-dim)", "Supabase PostgreSQL (pgvector)", "Table `document_chunks` with HNSW index", "Isolated via mandatory `WHERE unit_code = ?` SQL filter."],
        ["Authentic Binary PDFs", "Supabase Storage CDN", "Bucket `course-documents` (Public Read)", "Direct HTTPS URLs (`window.open(url, '_blank')`)."],
        ["Chat History & Transcripts", "MongoDB Atlas", "Collection `chat_transcripts` (BSON)", "Indexed by `user_id` and `session_id`."],
        ["Spaced Repetition Review States", "MongoDB Atlas", "Collection `flashcards` (BSON)", "Indexed by `user_id`, `unit_code`, and `next_review_date`."],
    ]
    story.append(make_table(storage_table[0], storage_table[1:], [120, 110, 134, 140], styles))
    story.append(PageBreak())

    # 7. Section 8.0 & 9.0: Scalability, Elasticity & DR
    story.append(Paragraph("8.0 SYSTEM SCALABILITY, ELASTICITY & THROUGHPUT DESIGN", styles['h1']))
    story.append(Paragraph(
        "To sustain peak exam revision periods (100+ simultaneous students): "
        "<b>1. Stateless Application Design:</b> The FastAPI backend maintains zero in-memory session state. All requests are authenticated "
        "via stateless JWTs and state is persisted in MongoDB Atlas, allowing the Azure App Service container to scale horizontally without sticky sessions. "
        "<b>2. Connection Pooling Architecture:</b> PostgreSQL connections are routed through the Supabase Transaction Pooler (port 6543) running PgBouncer, "
        "allowing hundreds of short-lived queries to share a lean pool of 15 physical database connections without connection exhaustion. "
        "<b>3. CDN Offloading:</b> High-bandwidth PDF downloads (often 20MB to 50MB per textbook) bypass the backend container entirely, "
        "streaming directly from Supabase Storage edge nodes.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("9.0 HIGH-AVAILABILITY, FAULT TOLERANCE & DISASTER RECOVERY", styles['h1']))
    story.append(Paragraph(
        "The system enforces strict Service Level Agreements (SLAs): "
        "<b>Availability Target:</b> 99.9% uptime (max allowable unscheduled downtime < 43.8 minutes per month). "
        "<b>Recovery Time Objective (RTO):</b> < 15 minutes to fully restore service in the event of an infrastructure failure. "
        "<b>Recovery Point Objective (RPO):</b> < 5 minutes of data loss (achieved via PostgreSQL Write-Ahead Logging / WAL archiving). "
        "<b>Circuit Breakers & Graceful Degradation:</b> If the primary Gemini LLM API experiences rate limits or outages, the system automatically "
        "degrades to the secondary LLM provider (OpenAI GPT-4o) or serves cached static cram sheets without throwing an unhandled HTTP 500 error.",
        styles['body']
    ))
    story.append(PageBreak())

    # 8. Section 10.0, 11.0, 12.0 & Signoff
    story.append(Paragraph("10.0 SECURITY ARCHITECTURE & PERIMETER DEFENSE", styles['h1']))
    story.append(Paragraph(
        "Perimeter defense enforces defense-in-depth: "
        "<b>(1) TLS 1.3 Transport Encryption:</b> All HTTP traffic is forced to HTTPS with HTTP Strict Transport Security (HSTS) headers enabled. "
        "<b>(2) CORS Policy:</b> Restricts cross-origin resource sharing strictly to `http://localhost:3000` and `https://learningassistant-chi.vercel.app`. "
        "<b>(3) Row-Level Security (RLS):</b> PostgreSQL security policies prevent student A from reading student B's private uploaded documents. "
        "<b>(4) Sanitization & Injection Defense:</b> All query inputs are stripped of control characters before embedding to prevent vector-space manipulation.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("11.0 OBSERVABILITY, TELEMETRY & HEALTH CHECKS", styles['h1']))
    story.append(Paragraph(
        "System reliability is monitored in real time: "
        "<b>Synthetic Health Endpoint:</b> `GET /api/health` performs live read/write probes against PostgreSQL and MongoDB, returning HTTP 200 "
        "with latency metrics. Azure App Service health watchdogs query this endpoint every 60 seconds and trigger automated container restart upon consecutive failures. "
        "<b>Error Monitoring:</b> Sentry captures unhandled exceptions with full stack traces, breadcrumbs, and user context. "
        "<b>Structured Logging:</b> Uvicorn outputs standardized JSON logs ingested by Azure Log Analytics.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("12.0 FORMAL DESIGN REVIEW & GOVERNANCE SIGN-OFF", styles['h1']))
    story.append(Paragraph("This High-Level Design document is formally certified and accepted by the technical review board.", styles['body']))

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
