# 🎓 EduRAG Scholar: Product Requirements Document (PRD) & Technical Architecture Specification

> **System Name:** EduRAG Scholar (Autonomous 7-Unit RAG & Web-Agent System)  
> **Stakeholder & Lead Engineer:** Asman Makero Musa (B.Sc. Computer Science, Year 2)  
> **Institution:** University of Nairobi (UoN), Department of Computing and Informatics, Chiromo  
> **Target Semester:** First Semester 2026/2027 (Classes: Sept 7 – Dec 4, 2026 | Exams: Dec 7 – 18, 2026)  
> **Document Version:** 1.0.0 (SDLC Phase 1 Baseline)  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Chiromo Dilemma
Second-year Computer Science students at the University of Nairobi face 7 heavy academic units simultaneously. The semester demands mastery of dense slide decks, textbooks, algorithm proofs, system architectures, and past examination papers.

Generic commercial LLMs (standard ChatGPT) fail due to:
1. **Curriculum Agnosticism:** Ignorance of specific UoN lecturers' syllabi, terminology, and marking schemes.
2. **Context Contamination:** Answers bleed concepts across units (e.g., mixing OS thread scheduling with Systems Analysis lifecycles).
3. **Hallucination & Lack of Verifiability:** Inability to cite exact slide numbers or textbook pages for exam defense.
4. **Passive Architecture:** Generic LLMs wait for prompts; they do not proactively track a timetable or prepare students for tomorrow's 9:00 AM lecture in LG01.

### 1.2 The Solution
**EduRAG Scholar** is a high-performance, unit-isolated, multi-tenant academic intelligence workstation comprising:
- **Unit-Isolated Vector Store:** Strict metadata partitioning across all 7 units using Supabase `pgvector`.
- **Hybrid Ingestion Engine:** Parses native PDFs, PowerPoint `.pptx` decks, Word `.docx`, and OCR-processed scanned handouts.
- **Agentic Academic Web Fallback:** RAG-first semantic search with autonomous fallback to live academic search (Tavily/Google) when local notes have knowledge gaps, plus a manual "Deep Search" mode.
- **The 3 AM Nightly Abstractor:** An autonomous background daemon running on Railway that cross-references the student's timetable with prior study weaknesses, generates a targeted morning briefing, emails it via SendGrid, and pins it to the web dashboard.
- **Past Papers Intelligence Suite:** Topic frequency trending, UoN lecturer marking-scheme compliant solutions, and a timed mock exam simulator.
- **Notion/Linear-Style Split Workstation:** Next.js interface with click-to-jump slide viewer, KaTeX LaTeX math support, and Mermaid diagramming.

---

## 2. User Personas & Role-Based Access Control (RBAC)

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +UserRole role
        +DateTime created_at
    }
    class UserRole {
        <<enumeration>>
        ADMIN_OWNER
        STUDENT_PEER
    }
    class Permission {
        +Boolean can_upload_materials
        +Boolean can_trigger_reindex
        +Boolean can_manage_users
        +Boolean can_chat_and_quiz
        +Boolean can_receive_nightly_briefing
    }
    User --> UserRole
    UserRole --> Permission
```

1. **Admin / Owner (Asman Makero Musa):**
   - Full read/write/delete privileges across all units.
   - Uploads and reindexes course materials, syllabus files, and past papers.
   - Configures system prompts, Azure OpenAI deployments, and the 3 AM cron schedule.
   - Receives personalized SendGrid morning briefings.

2. **Student Peer (Study Group Member):**
   - Authenticated via Supabase Auth.
   - Read-only access to unit knowledge bases and past papers.
   - Independent chat sessions, personal weakness tracking, and mock exam test history.
   - Cannot delete or overwrite central course slides or trigger expensive bulk re-embeddings.

---

## 3. Academic Units & Schedule Specification

### 3.1 The 7 Semester Units
| Code | Course Title | Lecturer | Pedagogical Style | Primary Formats |
|---|---|---|---|---|
| **SMA 2114** | Differential and Integral Calculus | Dr. Okeyo | Math proofs, calculus derivations, formulas | Handouts, Scanned PDFs, Past Papers |
| **SCS 3201** | Systems Analysis and Design | Mr. Shonyela Ochukut | SDLC methodologies, UML, structural diagrams | Slide decks (`.pptx`/`.pdf`), Case studies |
| **SCS 3203** | Computer Architecture | Dr. Yohanna | CPU registers, pipelining, logic circuits, memory | Slides, Hardware schematics, Past Papers |
| **SCS 3205** | Knowledge-Based Systems & Programming | Dr. Mutemi | Expert systems, logic rules, inference engines | Lecture slides, Code snippets |
| **SCS 3207** | Operating Systems | Dr. Miriti | Concurrency, deadlocks, paging, kernels | Heavy slide decks, algorithmic problems |
| **SCS 3209** | Software Engineering | Mr. Gordon | Agile, architecture, testing patterns, metrics | Slide decks, past papers, project docs |
| **CSC 3211** | Computer Networks | Ms. Ronge | OSI/TCP-IP layers, subnetting, protocols, RFCs | Slide decks, networking diagrams |

### 3.2 Teaching Timetable Matrix (Venue: LG01)
```mermaid
gantt
    title Weekly Chiromo Teaching Timetable (LG01)
    dateFormat HH:mm
    axisFormat %H:%M

    section Monday
    SCS 3201 Systems Analysis   :09:00, 105m
    SCS 3207 Operating Systems  :11:15, 105m
    CSC 3211 Computer Networks  :14:00, 105m

    section Tuesday
    SMA 2114 Calculus           :09:00, 105m
    SCS 3203 Computer Arch      :11:15, 105m
    SCS 3205 KBS & Prog         :14:00, 105m

    section Wednesday
    SCS 3207 Operating Systems  :09:00, 105m
    SCS 3201 Systems Analysis   :11:15, 105m

    section Thursday
    SCS 3209 Software Eng       :09:00, 105m
    SCS 3203 Computer Arch      :11:15, 105m
    SCS 3205 KBS & Prog         :14:00, 105m

    section Friday
    SMA 2114 Calculus           :09:00, 105m
    CSC 3211 Computer Networks  :11:15, 105m
    SCS 3209 Software Eng       :14:00, 105m
```

---

## 4. System Architecture & Component Design

```mermaid
flowchart TD
    subgraph CLIENT["Frontend Client (Next.js 14/15 App Router on Vercel)"]
        UI["Linear/Notion-Style Workstation"]
        CHAT_UI["Interactive Split Chat"]
        DOC_VIEWER["Synchronized Slide/PDF Viewer"]
        DASH["Daily Mission & Briefing Card"]
        PAST_PAPERS_UI["Exam Predictor & Simulator"]
    end

    subgraph BACKEND["AI Backend (FastAPI on Railway)"]
        API["FastAPI Gateway & Security Middleware"]
        ROUTER["Agentic Decision Router\n(LangChain / LangGraph)"]
        INGEST["Ingestion & OCR Worker\n(PyMuPDF, python-pptx, Tesseract)"]
        ABSTRACT["3 AM Nightly Abstractor Worker\n(APScheduler / Cron)"]
    end

    subgraph CLOUD_STORAGE["Cloud Infrastructure (Supabase & Azure)"]
        AUTH["Supabase Auth (JWT & RBAC)"]
        PG["PostgreSQL Database"]
        PGVEC["pgvector Extension (1536-dim Index)"]
        S3["Supabase Storage (Raw PDFs & PPTX)"]
        AZURE_LLM["Azure OpenAI Service\n(gpt-4o-mini & text-embedding-3-small)"]
    end

    subgraph EXTERNAL["External Intelligence & Delivery"]
        TAVILY["Tavily Academic Web Search API"]
        SENDGRID["SendGrid Email API"]
        SENTRY["Sentry Performance & Error Tracing"]
    end

    CLIENT <-->|REST / SSE Streaming| API
    API --> ROUTER
    API --> INGEST
    ABSTRACT --> ROUTER
    
    INGEST -->|Extract & Chunk| S3
    INGEST -->|Embed Vectors| AZURE_LLM
    AZURE_LLM -->|Save Chunks| PGVEC
    
    ROUTER -->|1. Unit-Filtered RAG| PGVEC
    ROUTER -->|2. Low-Confidence / Deep Search| TAVILY
    ROUTER -->|3. Answer Synthesis| AZURE_LLM
    
    ABSTRACT -->|Query Timetable & Weaknesses| PG
    ABSTRACT -->|Synthesize Morning Briefing| AZURE_LLM
    ABSTRACT -->|Send Briefing Email| SENDGRID
    ABSTRACT -->|Persist Daily Mission| PG
    
    API --> SENTRY
```

---

## 5. Functional Specifications

### 5.1 Ingestion & Processing Pipeline
1. **Multi-Format Ingestion:**
   - `.pdf`: PyMuPDF / pdfplumber for digital slides, text, and vector graphics.
   - `.pptx`: `python-pptx` to parse titles, slide bullets, shapes, and presenter notes.
   - `.docx`: `python-docx` for syllabus outlines and assignment sheets.
   - **OCR Fallback:** Scanned photocopied handouts or exam papers run through image binarization and Tesseract / Azure Vision OCR.
2. **Slide-Aware Semantic Chunking:**
   - Preserves unit code, file name, slide/page number, and header hierarchy in metadata.
   - Slide chunk boundary: 1 slide = 1 primary chunk (with sliding window overlap if slide text exceeds 600 tokens).
3. **Vector Embeddings:**
   - Model: Azure OpenAI `text-embedding-3-small` (1536 dimensions).
   - Stored in Supabase `pgvector` with HNSW cosine distance index.

### 5.2 Agentic Retrieval & Academic Web Fallback
```mermaid
flowchart TD
    A["User Prompt + Unit Context (e.g. SCS 3207)"] --> B{"Manual 'Deep Web' Toggle On?"}
    B -- Yes --> WEB["Invoke Tavily Search (Academic Domains)"]
    B -- No --> RAG["Execute Unit-Filtered pgvector Query (Top-K = 6)"]
    
    RAG --> C{"Max Similarity Score >= 0.72 AND Context Complete?"}
    C -- Yes --> SYNTH["Synthesize Answer with Lecture Slide Citations"]
    C -- No (Knowledge Gap) --> WEB_AUTO["Autonomous Fallback: Query Tavily Web Search"]
    
    WEB_AUTO --> MERGE["Merge Local Notes Context + Verified Web Snippets"]
    WEB --> MERGE
    MERGE --> SYNTH_DUAL["Synthesize Dual-Grounding Response"]
    
    SYNTH --> OUT["Output with [Unit | Slide #] Citations"]
    SYNTH_DUAL --> OUT2["Output with Partitioned [Slide #] + [Web URL] Citations"]
```

### 5.3 The 3 AM Nightly Abstractor
- **Trigger:** Scheduled cron at 03:00 EAT (East Africa Time) on Railway.
- **Workflow:**
  1. Determine current day of week. If weekday, lookup scheduled units from `timetable_slots` (e.g., Tuesday $\rightarrow$ SMA 2114, SCS 3203, SCS 3205).
  2. Query `weakness_logs` and `chat_messages` from the last 48 hours for those units to identify topics where the student asked repeated questions or failed quizzes.
  3. Query vector store for the upcoming syllabus module for each unit.
  4. Generate a concise, high-impact **Morning Briefing**:
     - *Today's Class Schedule & Lecture Objectives*
     - *Key Concepts & Trap Definitions to Anticipate*
     - *5-Minute Rapid-Fire Weakness Remediation Drill*
  5. Dispatch HTML email via SendGrid to Asman's inbox.
  6. Upsert briefing into `daily_briefings` table for display on dashboard.

### 5.4 Past Papers Engine
1. **Mode A — Predict & Trend:**
   - Vector search across all indexed exam questions for a specific unit.
   - Cluster questions by topic frequency (e.g., Page Replacement Algorithms, Paging vs Segmentation, Critical Section Solutions).
   - Output statistical trend breakdown and probability weights.
2. **Mode B — Model Marking Scheme Solver:**
   - Formulates answers strictly aligned with UoN lecturer grading patterns:
     - 1. Precise Academic Definition (2 marks)
     - 2. Architectural ASCII / Mermaid Diagram (4 marks)
     - 3. Step-by-Step Elaboration / Proof (6 marks)
     - 4. Advantages & Trade-Offs (3 marks)
   - Cites the specific lecture slide containing the syllabus foundation.
3. **Mode C — Mock Exam Simulator:**
   - Generates a timed session (e.g., 60 minutes, 3 questions, choice of 2).
   - Student enters answers into an in-browser markdown editor.
   - Evaluator agent assesses submission against the lecturer marking rubric, outputs score (out of 100), and provides actionable corrective feedback.

---

## 6. Database Schema Specification (Supabase PostgreSQL + pgvector)

```mermaid
erDiagram
    USERS ||--o{ CHAT_SESSIONS : owns
    USERS ||--o{ WEAKNESS_LOGS : records
    USERS ||--o{ DAILY_BRIEFINGS : receives
    UNITS ||--o{ DOCUMENTS : contains
    UNITS ||--o{ TIMETABLE_SLOTS : scheduled_at
    UNITS ||--o{ PAST_PAPERS : catalogs
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : has
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : contains

    USERS {
        uuid id PK
        text email UK
        text role
        timestamptz created_at
    }
    UNITS {
        text code PK
        text name
        text lecturer
        text venue
        int semester
    }
    TIMETABLE_SLOTS {
        uuid id PK
        text unit_code FK
        int day_of_week
        time start_time
        time end_time
    }
    DOCUMENTS {
        uuid id PK
        text unit_code FK
        text title
        text file_type
        text storage_url
        int page_count
        timestamptz uploaded_at
    }
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        text unit_code FK
        int page_number
        text content
        vector_1536 embedding
        jsonb metadata
    }
    PAST_PAPERS {
        uuid id PK
        text unit_code FK
        int exam_year
        text exam_month
        text paper_type
        uuid document_id FK
    }
    CHAT_SESSIONS {
        uuid id PK
        uuid user_id FK
        text unit_code FK
        text title
        timestamptz created_at
    }
    CHAT_MESSAGES {
        uuid id PK
        uuid session_id FK
        text sender
        text content
        jsonb citations
        boolean web_search_used
        timestamptz created_at
    }
    WEAKNESS_LOGS {
        uuid id PK
        uuid user_id FK
        text unit_code FK
        text topic_name
        text error_pattern
        int difficulty_level
        timestamptz logged_at
    }
    DAILY_BRIEFINGS {
        uuid id PK
        uuid user_id FK
        date briefing_date
        text markdown_content
        boolean emailed
        timestamptz created_at
    }
```

---

## 7. SDLC Implementation Milestones

```mermaid
flowchart LR
    M1["Milestone 1:\nPRD & Database Setup\n(Supabase & pgvector)"]
    M2["Milestone 2:\nBackend & Ingestion\n(FastAPI, Parsers, Azure Embeddings)"]
    M3["Milestone 3:\nAgentic RAG Core\n(Unit Isolation & Tavily Fallback)"]
    M4["Milestone 4:\n3 AM Abstractor &\nPast Papers Engine"]
    M5["Milestone 5:\nNext.js Split UI &\nEnd-to-End Verification"]

    M1 --> M2 --> M3 --> M4 --> M5
```

- [x] **Milestone 1:** Requirements discovery, formal PRD, database schema design, and cloud service configuration.
- [ ] **Milestone 2:** Backend repository scaffolding, Supabase connection, file parsers (PDF, PPTX, OCR), and chunk-indexing pipeline.
- [ ] **Milestone 3:** Unit-isolated RAG query API, Azure OpenAI integration, and autonomous Tavily search fallback router.
- [ ] **Milestone 4:** Railway background cron worker for the 3 AM Nightly Abstractor (SendGrid email dispatch) and the 3-mode Past Papers engine.
- [ ] **Milestone 5:** Next.js modern workstation frontend (split-screen slide viewer, KaTeX, Mermaid diagrams, chat UI) and deployment to Vercel.