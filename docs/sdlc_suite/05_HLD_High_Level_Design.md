# 📐 High-Level Design Document (HLD)
## Project Name: EduRAG Scholar (Academic Masterclass & AI Copilot)
**Document Version:** 2.4.0  
**Lead Systems Designer:** Musa Makero  
**Status:** Approved for Implementation  

---

## 1. System Ingestion Pipeline Flow

```mermaid
flowchart TD
    A[Student / Instructor Uploads Course File] --> B{MIME Type Validation}
    B -->|PDF| C[PyMuPDF fitz Extractor]
    B -->|PPTX| D[python-pptx Extractor]
    B -->|DOCX| E[python-docx Extractor]
    B -->|Unsupported / Corrupt| F[Reject with HTTP 400]
    
    C --> G[Page-Level Extraction: Title, Content, Slide Number]
    D --> G
    E --> G
    
    G --> H[Register Document in Supabase: status=pending, is_processed=false]
    H --> I[Semantic Chunker: Slide Boundaries & Bullet Preservations]
    I --> J[Embedding Generator: Batches of 50 chunks via Azure/Gemini]
    J --> K[Supabase pgvector: Insert Chunks in 250-record Batches]
    K --> L[Update Document Record: is_processed=true]
    L --> M[Return HTTP 200: Ingestion Complete]
```

---

## 2. Professor Masterclass Generation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant API as FastAPI Backend
    participant PG as PostgreSQL (Supabase)
    participant LLM as Azure OpenAI (GPT-4.1)

    Student->>API: GET /api/professor/document/{id}/syllabus
    API->>PG: Query distinct slide_title & page_numbers
    PG-->>API: Returns 531 slides
    API->>API: Dynamic Clustering: Groups into 5-slide Concept Batches
    API-->>Student: Returns Structured Syllabus Tree

    Student->>API: GET /api/professor/document/{id}/slide/{pageNum}
    API->>PG: SELECT content, slide_title WHERE page_number = pageNum
    PG-->>API: Returns raw text
    API-->>Student: Instant Raw Preview (<50ms)

    Student->>API: POST /api/professor/document/lesson (Pages 6 to 10)
    API->>PG: Fetch chunks for pages 6..10
    PG-->>API: Returns raw bullet points & titles
    API->>LLM: Injects Masterclass System Instruction + Raw Slide Context
    Note over LLM: Unpacks kernel structures, memory maps, C code & Section B traps
    LLM-->>API: Returns Structured Markdown Masterclass Lecture
    API-->>Student: Renders Full Professor Masterclass in Main Lecture Hall
```

---

## 3. High-Level Subsystem Breakdown

### 3.1 Document Ingestion Subsystem (`app.ingestion`)
* **Extractor (`extractor.py`):** Multi-format parser capable of extracting slide titles, bullet points, headers, and body text while filtering null bytes (`\x00`).
* **Chunker (`chunker.py`):** Segments documents cleanly along slide boundaries. Ensures that each slide's header and bullet structure are kept intact rather than sliced arbitrarily mid-sentence.
* **Embedder (`embedder.py`):** Translates raw text into normalized 1536-dimensional floating-point vectors. Implements automatic dimension validation and thread-safe batching.

### 3.2 RAG Router & Search Subsystem (`app.agents.rag_router`)
* **Hybrid Matcher:** Combines cosine distance vector search over Supabase with optional live Tavily search when the student asks for cutting-edge external research.
* **Grounding Engine:** Quotes exact slide numbers and textbook editions in answers to prevent student confusion.

### 3.3 Professor Course Subsystem (`app.services.professor_course_service`)
* **Syllabus Generator:** Dynamically analyzes a document's total page count and slide titles, producing both an **Individual Slide Tree** and a **Concept Batch Tree** (averaging 5 slides per lesson).
* **Pedagogical Masterclass Synthesizer:** Enforces graduate-level instructional depth, explicitly prohibiting superficial summaries and demanding C code implementations and Section B exam calculations.
* **Office Hours Arbiter:** Manages conversational state specifically grounded within the active slide boundaries.

### 3.4 Nightly Autonomous Abstractor (`app.workers.abstractor`)
* Configured with APScheduler to execute every night at **03:00 EAT**.
* Identifies newly uploaded documents, synthesizes executive chapter summaries, and populates student morning briefing archives.
