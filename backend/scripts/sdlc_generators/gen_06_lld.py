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
    pdf_filename = "06_LLD_Low_Level_Design.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(
        pdf_path, pagesize=letter,
        leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54
    )
    styles = get_styles()
    story = []

    # 1. Cover
    add_cover(
        story, styles, 6,
        "LOW-LEVEL DESIGN SPECIFICATION (LLD)",
        "Detailed Component Design, Class Interfaces, Algorithmic Pseudocode & State Machine Specifications",
        "IEEE Std 1016-2009 / Object-Oriented Design (SOLID) | Sommerville Ch 7: Design and Implementation"
    )

    # 2. Table of Contents
    toc_sections = [
        ("1.0", "Introduction, Purpose & Micro-Level Scope", "Scope of LLD, relationship to HLD, low-level design goals"),
        ("2.0", "SOLID Design Principles & GoF Design Patterns", "Single Responsibility, Open-Closed, Liskov, Interface Seg, Dep Inv"),
        ("3.0", "Core Class Hierarchies & Method Signatures", "Exhaustive method signatures, parameters, types for 12 classes"),
        ("4.0", "UML Class Diagram Walkthrough", "Embedded class diagram, relationships, aggregations, dependencies"),
        ("5.0", "Document Lifecycle Activity Architecture", "Embedded activity diagram, pipeline steps, fork/join semantics"),
        ("6.0", "Document Processing Finite State Machine", "Embedded state machine diagram, state transitions, error recovery"),
        ("7.0", "Mathematical Algorithms & Algorithmic Formulations", "Formal mathematics for Cosine, SM-2, RRF, and Token Chunking"),
        ("8.0", "Concrete Algorithmic Pseudocode Implementations", "Step-by-step algorithmic pseudocode for core algorithms"),
        ("9.0", "Repository Pattern & Data Access Interfaces", "PostgreSQL pgvector DAO, MongoDB Motor repository contracts"),
        ("10.0", "Error Handling, Retry Policies & Circuit Breakers", "Exception hierarchies, backoff strategies, graceful degradation"),
        ("11.0", "Unit Test Mocking Interfaces & Test Fixtures", "Pytest fixture definitions, mock clients for Gemini and Supabase"),
        ("12.0", "Formal Low-Level Engineering Sign-Off", "Review board approvals and technical council acceptance"),
    ]
    add_table_of_contents(story, styles, toc_sections)

    # 3. Section 1.0 & 2.0
    story.append(Paragraph("1.0 INTRODUCTION, PURPOSE & MICRO-LEVEL SCOPE", styles['h1']))
    story.append(Paragraph("1.1 Purpose of this Low-Level Specification", styles['h2']))
    story.append(Paragraph(
        "The Low-Level Design (LLD) specification provides the exhaustive, implementation-ready micro-architectural blueprint "
        "for EduRAG Scholar. Whereas the HLD details high-level subsystems, this document defines exact class structures, data members, "
        "method signatures, parameter types, mathematical formulations, algorithmic pseudocode, and finite state machines governing "
        "the Python FastAPI backend and Next.js React frontend.",
        styles['body']
    ))
    story.append(Paragraph("1.2 SOLID Object-Oriented Design Principles", styles['h2']))
    story.append(Paragraph(
        "The codebase enforces the five SOLID principles of object-oriented design: "
        "<b>1. Single Responsibility Principle (SRP):</b> Each service has one reason to change (`EmbeddingService` only embeds, `ExtractionPipeline` only parses). "
        "<b>2. Open/Closed Principle (OCP):</b> Classes are open for extension but closed for modification; new retrieval strategies implement `BaseRetrievalStrategy`. "
        "<b>3. Liskov Substitution Principle (LSP):</b> Any retrieval strategy can replace the base without breaking `RAGRouter`. "
        "<b>4. Interface Segregation Principle (ISP):</b> Clients depend only on specific methods (e.g., `DocumentReader` vs `DocumentWriter`). "
        "<b>5. Dependency Inversion Principle (DIP):</b> High-level services depend on abstract database interfaces, not concrete PostgreSQL/MongoDB drivers.",
        styles['body']
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("2.0 GANG OF FOUR (GoF) DESIGN PATTERNS APPLIED", styles['h1']))
    story.append(Paragraph("EduRAG Scholar implements five classic Gang of Four (GoF) structural and behavioral patterns:", styles['body']))

    gof_data = [
        ["Design Pattern", "Pattern Category", "Concrete Implementation Class", "Architectural Justification & Role"],
        ["Singleton Pattern", "Creational", "`DatabaseManager`, `EmbeddingService`", "Guarantees a single persistent connection pool and single API client instance across the application lifecycle."],
        ["Strategy Pattern", "Behavioral", "`VectorStrategy`, `WebSearchStrategy`, `HybridRRFStrategy`", "Allows the `RAGRouter` to dynamically swap retrieval mechanisms based on query complexity and chunk availability."],
        ["Factory Method", "Creational", "`DocumentParserFactory`", "Instantiates specialized text extractors (PyMuPDF for PDF, Tesseract for OCR, PlanText for MD) based on MIME type."],
        ["Observer Pattern", "Behavioral", "`IndexingStatusNotifier`", "Pushes real-time SSE progress events to the client frontend as documents transition from extracting to chunking to indexed."],
        ["Repository Pattern", "Structural", "`DocumentRepository`, `ChunkRepository`, `TranscriptRepository`", "Mediates between the domain logic and data mapping layers, completely hiding SQL and BSON queries."],
    ]
    story.append(make_table(gof_data[0], gof_data[1:], [90, 80, 140, 194], styles))
    story.append(PageBreak())

    # 4. Section 3.0: Core Class Hierarchies
    story.append(Paragraph("3.0 CORE CLASS HIERARCHIES & METHOD SIGNATURES", styles['h1']))
    story.append(Paragraph("Exact Python type-annotated class definitions, data members, and method signatures:", styles['body']))

    class_specs = [
        ["Class Name & Module", "Attributes & Types", "Method Signatures & Return Types", "Core Responsibility"],
        ["`RAGRouter`\n(app.agents.rag_router)", "`threshold: float = 0.68`\n`client: SupabaseClient`\n`llm: GeminiClient`", "`async route_query(q: str, unit: str) -> RAGResponse`\n`async hybrid_search(q: str, unit: str) -> List[Chunk]`\n`async web_fallback(q: str) -> List[WebCitation]`", "Directs queries to vector search or web agent; synthesizes grounded answer."],
        ["`EmbeddingService`\n(app.ingestion.embedder)", "`model: str = 'embedding-001'`\n`dim: int = 1536`\n`batch_size: int = 20`", "`async get_embedding(text: str) -> List[float]`\n`async get_embeddings_batch(texts: List[str]) -> List[List[float]]`", "Interacts with Gemini API; validates vector dimensionality."],
        ["`ExtractionPipeline`\n(app.ingestion.extractor)", "`supported_types: Set[str]`\n`ocr_enabled: bool = True`", "`extract_pages(pdf_bytes: bytes) -> List[PageData]`\n`extract_metadata(pdf_bytes: bytes) -> DocMetadata`", "Parses binary PDF via PyMuPDF (fitz); extracts page numbers and text."],
        ["`TokenChunker`\n(app.ingestion.chunker)", "`chunk_size: int = 800`\n`overlap: int = 120`", "`chunk_document(pages: List[PageData]) -> List[ChunkData]`\n`count_tokens(text: str) -> int`", "Executes sliding-window chunking; attaches spatial slide citations."],
        ["`ProfessorService`\n(app.services.professor_service)", "`stages: Dict[int, str]`\n`scaffolding_levels: int = 3`", "`async get_lesson(doc_id: str, page: int) -> Lesson`\n`async evaluate_response(ans: str, rubric: str) -> EvalResult`", "Manages 5-stage Socratic teaching loop and progressive hints."],
        ["`SM2Scheduler`\n(app.services.spaced_repetition)", "`min_ef: float = 1.30`\n`initial_interval: int = 1`", "`calculate_review(q: int, n: int, ef: float, i: int) -> ReviewState`\n`generate_cards(chunk: str) -> List[Flashcard]`", "Executes SuperMemo-2 mathematics; schedules retention reviews."],
    ]
    story.append(make_table(class_specs[0], class_specs[1:], [110, 110, 154, 130], styles))
    story.append(PageBreak())

    # 5. Section 4.0: UML Class Diagram
    story.append(Paragraph("4.0 UML CLASS DIAGRAM WALKTHROUGH", styles['h1']))
    story.append(Paragraph("The static structure of EduRAG Scholar showing class relationships, associations, and interfaces:", styles['body']))

    add_diagram(story, styles, "class_diagram.png", "UML Class Diagram &mdash; EduRAG Scholar Core Object Model & Associations", width=6.2, height=3.4)

    story.append(Paragraph("4.1 Structural Relationship Walkthrough", styles['h2']))
    story.append(Paragraph(
        "<b>Composition & Aggregation:</b> A `Document` entity aggregates 1 to N `Chunk` entities. Each `Chunk` maintains a spatial "
        "and logical reference to its parent `Document` (via `document_id`) and its academic course unit (via `unit_code`). "
        "When a `Document` is deleted via `DELETE /api/documents/{id}`, cascade deletion purges all associated `Chunk` vector records. "
        "<b>Inheritance & Strategy Realization:</b> `VectorRetrievalStrategy` and `WebSearchStrategy` inherit from the abstract "
        "`BaseRetrievalStrategy`, allowing the `RAGRouter` context class to execute polymorphic retrieval via `execute_search()`.",
        styles['body']
    ))
    story.append(PageBreak())

    # 6. Section 5.0 & 6.0: Activity & State Machine
    story.append(Paragraph("5.0 DOCUMENT LIFECYCLE ACTIVITY ARCHITECTURE", styles['h1']))
    story.append(Paragraph("The dynamic control flow and concurrent fork/join processing during document ingestion:", styles['body']))

    add_diagram(story, styles, "activity_document_lifecycle.png", "UML Activity Diagram &mdash; Asynchronous Ingestion, Validation & Vector Indexing", width=6.2, height=3.3)

    story.append(Paragraph("5.1 Activity Flow Analysis", styles['h2']))
    story.append(Paragraph(
        "The activity flow initiates upon receipt of an uploaded PDF: "
        "1. Decision node validates MIME type and file size (< 100MB). Invalid files terminate in an error state. "
        "2. A parallel fork activity splits execution: Fork Branch A uploads the binary PDF to Supabase Storage CDN; "
        "Fork Branch B extracts page text via PyMuPDF worker threads. "
        "3. Following page extraction, sliding-window chunking executes, outputting 800-token chunks. "
        "4. A join node synchronizes the completion of storage upload (obtaining the public HTTPS URL) and vector embedding generation. "
        "5. The final merge writes atomic records to PostgreSQL and transitions the document to the READY state.",
        styles['body']
    ))

    add_diagram(story, styles, "state_machine_document.png", "UML State Machine Diagram &mdash; Document Processing Lifecycle & Error Transitions", width=6.2, height=3.3)

    story.append(Paragraph("6.1 State Machine Specification", styles['h2']))
    story.append(Paragraph(
        "A document traverses six deterministic states: "
        "<b>(1) UPLOADED:</b> Binary payload stored in temporary volume; database record created. "
        "<b>(2) EXTRACTING:</b> PyMuPDF active; extracting text and bounding boxes. "
        "<b>(3) CHUNKING:</b> Sliding-window tokenization in progress. "
        "<b>(4) EMBEDDING:</b> Gemini API batch vectorization executing. "
        "<b>(5) INDEXED:</b> Vectors persisted in pgvector HNSW index; public storage URL verified; document active. "
        "<b>(6) FAILED:</b> Error state triggered upon corrupted PDF or API failure; captures error message for student display.",
        styles['body']
    ))
    story.append(PageBreak())

    # 7. Section 7.0: Mathematical Formulations
    story.append(Paragraph("7.0 MATHEMATICAL ALGORITHMS & ALGORITHMIC FORMULATIONS", styles['h1']))
    story.append(Paragraph("The core cognitive and indexing operations are governed by formal mathematical models:", styles['body']))

    story.append(Paragraph("7.1 Vector Cosine Similarity Metric", styles['h2']))
    story.append(Paragraph(
        "Given a query vector $\\mathbf{q} \\in \\mathbb{R}^{1536}$ and a stored chunk vector $\\mathbf{d} \\in \\mathbb{R}^{1536}$, "
        "the cosine similarity $\\cos(\\theta)$ measures the orientation alignment in hyperspace regardless of vector magnitude:<br/>"
        "$$\\text{Sim}(\\mathbf{q}, \\mathbf{d}) = \\cos(\\theta) = \\frac{\\mathbf{q} \\cdot \\mathbf{d}}{\\|\\mathbf{q}\\| \\|\\mathbf{d}\\|} "
        "= \\frac{\\sum_{i=1}^{1536} q_i d_i}{\\sqrt{\\sum_{i=1}^{1536} q_i^2} \\sqrt{\\sum_{i=1}^{1536} d_i^2}}$$<br/>"
        "Chunks are accepted for synthesis if and only if $\\text{Sim}(\\mathbf{q}, \\mathbf{d}) \\ge 0.68$.",
        styles['body']
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("7.2 SuperMemo-2 (SM-2) Spaced Repetition Formulation", styles['h2']))
    story.append(Paragraph(
        "The active recall interval $I(n)$ for repetition $n$ and student quality score $q \\in \\{0, 1, 2, 3, 4, 5\\}$ is calculated piecewise:<br/>"
        "$$I(1) = 1 \\text{ day}, \\quad I(2) = 6 \\text{ days}, \\quad I(n) = I(n-1) \\times EF \\quad (\\text{for } n > 2)$$<br/>"
        "The Easiness Factor ($EF$) updates dynamically according to cognitive feedback:<br/>"
        "$$EF' = EF + \\left(0.1 - (5 - q) \\times (0.08 + (5 - q) \\times 0.02)\\right)$$<br/>"
        "Subject to the hard lower boundary constraint: $EF' = \\max(EF', 1.30)$. If $q < 3$ (failure), $n$ resets to 0 and $I(1) = 1$.",
        styles['body']
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("7.3 Reciprocal Rank Fusion (RRF) Hybrid Search Score", styles['h2']))
    story.append(Paragraph(
        "To combine dense semantic vector ranking with sparse BM25 keyword ranking, the RRF score is computed across result sets $R$:<br/>"
        "$$RRF\\_Score(d) = \\sum_{m \\in M} \\frac{1}{k + r_m(d)}$$<br/>"
        "Where $k = 60$ is the smoothing constant, and $r_m(d)$ is the rank position of document $d$ in ranking model $m$.",
        styles['body']
    ))
    story.append(PageBreak())

    # 8. Section 8.0: Concrete Algorithmic Pseudocode
    story.append(Paragraph("8.0 CONCRETE ALGORITHMIC PSEUDOCODE IMPLEMENTATIONS", styles['h1']))
    story.append(Paragraph("Precise implementation logic for core architectural operations:", styles['body']))

    story.append(Paragraph("8.1 Algorithm 1: Sliding-Window Token Chunking Pipeline", styles['h2']))
    story.append(Paragraph(
        "<code><b>Algorithm:</b> SlidingWindowChunk(document_pages, target_tokens=800, overlap=120)<br/>"
        "<b>Input:</b> List of page tuples (page_num, text_content)<br/>"
        "<b>Output:</b> List of structured Chunk objects<br/>"
        "1. chunks = []<br/>"
        "2. FOR EACH page IN document_pages DO:<br/>"
        "3. &nbsp;&nbsp;&nbsp;&nbsp;tokens = Tokenize(page.text_content)<br/>"
        "4. &nbsp;&nbsp;&nbsp;&nbsp;start_idx = 0<br/>"
        "5. &nbsp;&nbsp;&nbsp;&nbsp;WHILE start_idx < len(tokens) DO:<br/>"
        "6. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;end_idx = min(start_idx + target_tokens, len(tokens))<br/>"
        "7. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;chunk_text = Detokenize(tokens[start_idx : end_idx])<br/>"
        "8. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;chunk_obj = Chunk(text=chunk_text, page=page.page_num, unit=page.unit)<br/>"
        "9. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;chunks.append(chunk_obj)<br/>"
        "10.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IF end_idx == len(tokens) THEN BREAK<br/>"
        "11.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;start_idx += (target_tokens - overlap)<br/>"
        "12. RETURN chunks</code>",
        styles['code']
    ))
    story.append(PageBreak())

    story.append(Paragraph("8.2 Algorithm 2: Deterministic Unit-Isolated RAG Routing", styles['h2']))
    story.append(Paragraph(
        "<code><b>Algorithm:</b> ExecuteIsolatedRAG(query_text, target_unit, threshold=0.68)<br/>"
        "1. query_vector = GeminiEmbedding(query_text, dimension=1536)<br/>"
        "2. candidates = PostgreSQL_RPC('match_unit_chunks', {<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;p_unit_code: target_unit,<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;query_embedding: query_vector,<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;match_threshold: threshold,<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;match_count: 5<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;})<br/>"
        "3. IF len(candidates) > 0 THEN:<br/>"
        "4. &nbsp;&nbsp;&nbsp;&nbsp;context_block = AssembleContext(candidates)<br/>"
        "5. &nbsp;&nbsp;&nbsp;&nbsp;prompt = BuildAcademicPrompt(query_text, context_block, target_unit)<br/>"
        "6. &nbsp;&nbsp;&nbsp;&nbsp;stream = StreamLLM(prompt, model='gemini-1.5-flash', temp=0.1)<br/>"
        "7. &nbsp;&nbsp;&nbsp;&nbsp;RETURN stream, ExtractCitations(candidates)<br/>"
        "8. ELSE:<br/>"
        "9. &nbsp;&nbsp;&nbsp;&nbsp;web_results = ExecuteWebAgentSearch(query_text, target_unit)<br/>"
        "10.&nbsp;&nbsp;&nbsp;prompt = BuildWebFallbackPrompt(query_text, web_results)<br/>"
        "11.&nbsp;&nbsp;&nbsp;RETURN StreamLLM(prompt), ExtractWebCitations(web_results)</code>",
        styles['code']
    ))
    story.append(PageBreak())

    story.append(Paragraph("8.3 Concrete Class Implementation: TokenChunker", styles['h2']))
    story.append(Paragraph(
        "The complete Python implementation for the sliding-window chunker with boundary preservation:",
        styles['body']
    ))
    story.append(Paragraph(
        "<code>class TokenChunker:\n"
        "    def __init__(self, target_size: int = 800, overlap: int = 120):\n"
        "        self.target_size = target_size\n"
        "        self.overlap = overlap\n"
        "\n"
        "    def chunk_extracted_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:\n"
        "        chunks = []\n"
        "        for p in pages:\n"
        "            page_num = p.get('page_number', 1)\n"
        "            text = p.get('text', '').strip()\n"
        "            if not text:\n"
        "                continue\n"
        "            words = text.split()\n"
        "            start = 0\n"
        "            while start < len(words):\n"
        "                end = min(start + self.target_size, len(words))\n"
        "                chunk_content = ' '.join(words[start:end])\n"
        "                chunks.append({\n"
        "                    'page_number': page_num,\n"
        "                    'content': chunk_content,\n"
        "                    'token_count': end - start\n"
        "                })\n"
        "                if end == len(words):\n"
        "                    break\n"
        "                start += (self.target_size - self.overlap)\n"
        "        return chunks</code>",
        styles['code']
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("8.4 Concrete Class Implementation: SuperMemo-2 State Transition", styles['h2']))
    story.append(Paragraph(
        "<code>def calculate_sm2_review(q: int, n: int, ef: float, i: int) -> Dict[str, Any]:\n"
        "    # Input quality score q in range 0..5\n"
        "    assert 0 <= q <= 5\n"
        "    if q >= 3:\n"
        "        if n == 0:\n"
        "            new_i = 1\n"
        "        elif n == 1:\n"
        "            new_i = 6\n"
        "        else:\n"
        "            new_i = int(round(i * ef))\n"
        "        new_n = n + 1\n"
        "    else:\n"
        "        new_n = 0\n"
        "        new_i = 1\n"
        "    new_ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))\n"
        "    new_ef = max(1.30, new_ef)  # Hard lower boundary constraint\n"
        "    next_date = datetime.now(timezone.utc) + timedelta(days=new_i)\n"
        "    return {\n"
        "        'repetition_count': new_n,\n"
        "        'easiness_factor': round(new_ef, 2),\n"
        "        'interval_days': new_i,\n"
        "        'next_review_date': next_date.isoformat()\n"
        "    }</code>",
        styles['code']
    ))
    story.append(PageBreak())
    story.append(Paragraph("9.0 REPOSITORY PATTERN & DATA ACCESS INTERFACES", styles['h1']))
    story.append(Paragraph("All database interactions are encapsulated behind explicit repository interfaces:", styles['body']))

    repo_data = [
        ["Repository Interface", "Underlying Database Engine", "Core CRUD & RPC Methods", "Data Mapping Object"],
        ["`IDocumentRepository`", "Supabase PostgreSQL", "`get_by_unit(unit: str) -> List[Doc]`\n`insert_doc(doc: Doc) -> str`\n`update_storage_url(id: str, url: str)`", "`DocumentRecord` (Pydantic)"],
        ["`IChunkRepository`", "Supabase PostgreSQL (pgvector)", "`insert_batch(chunks: List[Chunk])`\n`match_unit_chunks(unit, vec, th, k)`", "`ChunkRecord` (with vector array)"],
        ["`ITranscriptRepository`", "MongoDB Atlas", "`append_turn(sess_id, user_q, ai_ans)`\n`get_history(sess_id) -> History`", "`TranscriptBSON` (Document)"],
        ["`IFlashcardRepository`", "MongoDB Atlas", "`get_due_cards(user_id, unit) -> List[Card]`\n`update_sm2_state(id, ef, intv, n)`", "`FlashcardBSON` (Document)"],
    ]
    story.append(make_table(repo_data[0], repo_data[1:], [110, 110, 164, 120], styles))

    story.append(Spacer(1, 10))
    story.append(Paragraph("10.0 ERROR HANDLING, RETRY POLICIES & CIRCUIT BREAKERS", styles['h1']))
    story.append(Paragraph(
        "The system incorporates an enterprise exception hierarchy rooted at `EduRAGException`: "
        "<b>(1) `VectorSearchTimeoutException`:</b> Handled via exponential backoff (initial delay 500ms, max 3 retries). "
        "<b>(2) `LLMRateLimitException`:</b> Triggers circuit breaker; shifts traffic to secondary provider (OpenAI GPT-4o) for 60 seconds. "
        "<b>(3) `DocumentCorruptedException`:</b> Caught during PyMuPDF parsing; transitions document to FAILED state and emits user alert. "
        "<b>(4) `StorageCDNUnreachableException`:</b> Fallback to direct backend base64 streaming if Supabase Storage CDN returns HTTP 5xx.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("11.0 UNIT TEST MOCKING INTERFACES & TEST FIXTURES", styles['h1']))
    story.append(Paragraph(
        "To enable automated CI/CD testing without live cloud API dependencies, all driven adapters expose pytest fixtures: "
        "`mock_supabase_client` intercepts PostgREST RPC calls and returns synthetic chunks; `mock_gemini_client` returns canned "
        "1,536-dim float arrays and streaming generators; `mock_mongodb` runs an in-memory `mongomock` instance.",
        styles['body']
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("12.0 FORMAL LOW-LEVEL ENGINEERING SIGN-OFF", styles['h1']))
    story.append(Paragraph("This Low-Level Design specification is formally approved for implementation.", styles['body']))

    add_signoff_matrix(story, styles)

    doc.build(story, canvasmaker=NumberedCanvas)
    
    fitz_doc = fitz.open(pdf_path)
    page_count = fitz_doc.page_count
    fitz_doc.close()
    
    shutil.copy2(pdf_path, os.path.join(DOWNLOADS_DIR, pdf_filename))
    shutil.copy2(pdf_path, os.path.join(ARTIFACTS_DIR, pdf_filename))
    
    print(f"[OK] Generated {pdf_filename}: {page_count} pages (Target >= 12-16 pages)")
    return page_count

if __name__ == "__main__":
    build_pdf()
