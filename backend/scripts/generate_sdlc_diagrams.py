import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = os.path.abspath("docs/diagrams")
os.makedirs(OUT_DIR, exist_ok=True)

def setup_canvas(width=10, height=6, bg='#F8FAFC'):
    fig, ax = plt.subplots(figsize=(width, height), dpi=300)
    fig.patch.set_facecolor(bg)
    ax.set_facecolor(bg)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    return fig, ax

def draw_box(ax, x, y, w, h, text, title=None, color='#2563EB', text_color='white', title_color='white', radius=2, fontsize=10):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad={radius},rounding_size={radius}",
                                  facecolor=color, edgecolor='#0F172A', linewidth=1.5, zorder=2)
    ax.add_patch(rect)
    if title:
        ax.text(x + w/2, y + h*0.75, title, color=title_color, fontsize=fontsize+1, fontweight='bold',
                ha='center', va='center', zorder=3)
        ax.text(x + w/2, y + h*0.35, text, color=text_color, fontsize=fontsize-1,
                ha='center', va='center', zorder=3)
    else:
        ax.text(x + w/2, y + h/2, text, color=text_color, fontsize=fontsize, fontweight='bold',
                ha='center', va='center', zorder=3)

def draw_cylinder(ax, x, y, w, h, text, color='#059669', text_color='white'):
    rect = patches.Rectangle((x, y), w, h, facecolor=color, edgecolor='#0F172A', linewidth=1.5, zorder=2)
    ax.add_patch(rect)
    # top ellipse
    top = patches.Ellipse((x + w/2, y + h), w, h*0.3, facecolor=color, edgecolor='#0F172A', linewidth=1.5, zorder=3)
    ax.add_patch(top)
    # bottom line
    bot = patches.Arc((x + w/2, y), w, h*0.3, angle=0, theta1=180, theta2=360, edgecolor='#0F172A', linewidth=1.5, zorder=3)
    ax.add_patch(bot)
    ax.text(x + w/2, y + h*0.45, text, color=text_color, fontsize=9, fontweight='bold', ha='center', va='center', zorder=4)

def draw_arrow(ax, x1, y1, x2, y2, label=None, color='#1E293B', lw=1.5, style="->", rad=0.0, linestyle='-'):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw, linestyle=linestyle,
                                connectionstyle=f"arc3,rad={rad}", shrinkA=5, shrinkB=5),
                zorder=1)
    if label:
        mx, my = (x1 + x2)/2, (y1 + y2)/2
        ax.text(mx, my + 2, label, fontsize=8, color='#334155', ha='center', va='center',
                bbox=dict(boxstyle="round,pad=0.2", facecolor='white', edgecolor='#CBD5E1', lw=0.8, alpha=0.9),
                zorder=4)

# 1. DFD Level 0
def gen_dfd_level_0():
    fig, ax = setup_canvas(11, 6)
    ax.text(50, 93, "DATA FLOW DIAGRAM (DFD) - CONTEXT DIAGRAM (LEVEL 0)", fontsize=13, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 88, "EduRAG Scholar Academic Copilot System Boundary & External Entities", fontsize=9, ha='center', color='#64748B')
    
    # Central Process
    circle = patches.Circle((50, 48), 16, facecolor='#1E40AF', edgecolor='#0F172A', linewidth=2, zorder=2)
    ax.add_patch(circle)
    ax.text(50, 52, "0.0", color='#93C5FD', fontsize=12, fontweight='bold', ha='center')
    ax.text(50, 47, "EduRAG Scholar", color='white', fontsize=11, fontweight='bold', ha='center')
    ax.text(50, 42, "Academic RAG Platform", color='#E2E8F0', fontsize=8, ha='center')

    # External Entities
    draw_box(ax, 5, 65, 18, 14, "Student / Scholar\n(UoN Chiromo Year 2)", title="EXTERNAL ENTITY", color='#0284C7', radius=1)
    draw_box(ax, 5, 20, 18, 14, "Lecturer / Professor\n(Academic Staff)", title="EXTERNAL ENTITY", color='#0284C7', radius=1)
    draw_box(ax, 77, 65, 18, 14, "Google Gemini AI\n(Embeddings & LLM)", title="EXTERNAL SYSTEM", color='#7C3AED', radius=1)
    draw_box(ax, 77, 20, 18, 14, "Supabase Cloud\n(PostgreSQL pgvector)", title="EXTERNAL SYSTEM", color='#059669', radius=1)

    # Data flows
    draw_arrow(ax, 23, 73, 38, 58, "PDF Notes, Past Papers, Chat Prompts", rad=-0.1)
    draw_arrow(ax, 38, 52, 23, 67, "Contextual Answers, Citations, Quizzes", rad=-0.1)

    draw_arrow(ax, 23, 27, 38, 40, "Lecture Topic, Book Choice, Syllabus", rad=0.1)
    draw_arrow(ax, 38, 46, 23, 33, "Generated Slide Deck, Teaching Notes", rad=0.1)

    draw_arrow(ax, 62, 54, 77, 72, "Prompt Tokens & Semantic Chunks", rad=0.1)
    draw_arrow(ax, 77, 68, 62, 50, "768d Vector Embeddings, LLM Stream", rad=0.1)

    draw_arrow(ax, 62, 45, 77, 28, "Chunk Upsert & Match RPC Query", rad=-0.1)
    draw_arrow(ax, 77, 32, 62, 41, "Ranked Similarity Chunks, Metadata", rad=-0.1)

    fig.savefig(os.path.join(OUT_DIR, "dfd_level_0.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated dfd_level_0.png")

# 2. DFD Level 1
def gen_dfd_level_1():
    fig, ax = setup_canvas(13, 7.5)
    ax.text(50, 95, "DATA FLOW DIAGRAM (DFD) - LEVEL 1 DETAILED PROCESS DECOMPOSITION", fontsize=13, fontweight='bold', ha='center', color='#0F172A')
    
    # Processes
    draw_box(ax, 5, 68, 20, 15, "1.0 Ingestion &\nOCR Extraction", color='#2563EB', radius=2)
    draw_box(ax, 38, 68, 20, 15, "2.0 Semantic Chunking\n& Preprocessing", color='#2563EB', radius=2)
    draw_box(ax, 73, 68, 22, 15, "3.0 Gemini Vector\nEmbedding (768d)", color='#7C3AED', radius=2)

    draw_box(ax, 5, 20, 20, 15, "4.0 Context Query &\nCosine Match Engine", color='#2563EB', radius=2)
    draw_box(ax, 38, 20, 20, 15, "5.0 RAG Response\nGeneration & Citations", color='#2563EB', radius=2)
    draw_box(ax, 73, 20, 22, 15, "6.0 Professor Studio\nLecture Deck Synthesizer", color='#D97706', radius=2)

    # Data Stores (Cylinders)
    draw_cylinder(ax, 40, 46, 18, 12, "D1: Documents &\nMetadata Store", color='#059669')
    draw_cylinder(ax, 75, 46, 18, 12, "D2: pgvector Chunks\n(768d Embeddings)", color='#059669')

    # Arrows
    draw_arrow(ax, 25, 75, 38, 75, "Raw Cleaned Text")
    draw_arrow(ax, 58, 75, 73, 75, "Tokenized Chunks")
    draw_arrow(ax, 84, 68, 84, 58, "Embeddings + Vectors")
    draw_arrow(ax, 48, 68, 48, 58, "Doc Record")

    draw_arrow(ax, 15, 35, 15, 68, "Unit Context")
    draw_arrow(ax, 25, 27, 38, 27, "Top-K Chunks")
    draw_arrow(ax, 40, 50, 25, 29, "Read Chunks", rad=0.1)
    draw_arrow(ax, 75, 50, 25, 25, "Vector Cosine Search", rad=0.2)
    draw_arrow(ax, 58, 27, 73, 27, "Synthesized Content")

    fig.savefig(os.path.join(OUT_DIR, "dfd_level_1.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated dfd_level_1.png")

# 3. Use Case Diagram
def gen_use_case():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "UML SYSTEM USE CASE DIAGRAM - EDURAG SCHOLAR", fontsize=13, fontweight='bold', ha='center', color='#0F172A')

    # System boundary
    rect = patches.FancyBboxPatch((28, 5), 52, 85, boxstyle="round,pad=1", facecolor='white', edgecolor='#2563EB', linewidth=2, zorder=1)
    ax.add_patch(rect)
    ax.text(54, 87, "System Boundary: EduRAG Scholar Platform", fontsize=10, fontweight='bold', color='#1E40AF', ha='center')

    # Actors
    def draw_stick_man(ax, x, y, label):
        head = patches.Circle((x, y+4), 2, facecolor='#0F172A', edgecolor='#0F172A', zorder=3)
        ax.add_patch(head)
        ax.plot([x, x], [y+2, y-3], color='#0F172A', lw=2, zorder=3) # torso
        ax.plot([x-3, x+3], [y+1, y+1], color='#0F172A', lw=2, zorder=3) # arms
        ax.plot([x, x-2.5], [y-3, y-7], color='#0F172A', lw=2, zorder=3) # left leg
        ax.plot([x, x+2.5], [y-3, y-7], color='#0F172A', lw=2, zorder=3) # right leg
        ax.text(x, y-10, label, fontsize=9, fontweight='bold', ha='center', color='#0F172A')

    draw_stick_man(ax, 12, 65, "Chiromo Student\n(Scholar)")
    draw_stick_man(ax, 12, 25, "Course Lecturer\n(Professor)")
    draw_stick_man(ax, 90, 45, "System Admin\n& AI Agent")

    # Use Cases (Ovals)
    use_cases = [
        (40, 75, "Upload Academic Notes & Past Papers"),
        (40, 62, "Query Unit Notes with Strict RAG"),
        (40, 49, "View Real-Time Verified Citations"),
        (40, 36, "Select Prescribed Book & Topic"),
        (40, 23, "Generate Multi-Slide Batch Lecture"),
        (40, 10, "Delete Ingested Document & Chunks"),
        (65, 75, "Execute Azure Vision OCR"),
        (65, 49, "Stream AI Explanation (SSE)"),
    ]
    for x, y, name in use_cases:
        ellipse = patches.Ellipse((x+7, y+3), 20, 7, facecolor='#EFF6FF', edgecolor='#1D4ED8', linewidth=1.5, zorder=2)
        ax.add_patch(ellipse)
        ax.text(x+7, y+3, name, fontsize=7.5, fontweight='bold', color='#1E3A8A', ha='center', va='center', zorder=3)

    # Actor associations
    ax.plot([15, 37], [67, 78], color='#334155', lw=1.2)
    ax.plot([15, 37], [65, 65], color='#334155', lw=1.2)
    ax.plot([15, 37], [63, 52], color='#334155', lw=1.2)

    ax.plot([15, 37], [28, 39], color='#334155', lw=1.2)
    ax.plot([15, 37], [25, 26], color='#334155', lw=1.2)
    ax.plot([15, 37], [22, 13], color='#334155', lw=1.2)

    ax.plot([87, 57], [45, 13], color='#334155', lw=1.2)
    ax.plot([87, 82], [47, 52], color='#334155', lw=1.2)

    # <<include>> / <<extend>>
    draw_arrow(ax, 57, 78, 62, 78, "<<include>>", color='#DC2626')
    draw_arrow(ax, 57, 52, 62, 52, "<<include>>", color='#DC2626')

    fig.savefig(os.path.join(OUT_DIR, "use_case_diagram.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated use_case_diagram.png")

# 4. Sequence Diagram: Ingestion & OCR
def gen_sequence_ingestion():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "UML SEQUENCE DIAGRAM - MULTI-TENANT DOCUMENT INGESTION & OCR FALLBACK", fontsize=11, fontweight='bold', ha='center', color='#0F172A')

    lifelines = [
        (10, "Student / Client"),
        (30, "FastAPI Router\n(/api/documents)"),
        (50, "Extractor\n(PyMuPDF)"),
        (70, "Azure OpenAI\nVision OCR"),
        (90, "Supabase DB\n(pgvector)"),
    ]
    for x, name in lifelines:
        draw_box(ax, x-9, 82, 18, 8, name, color='#1E293B', fontsize=8, radius=1)
        ax.plot([x, x], [82, 10], color='#94A3B8', linestyle='--', lw=1.2)

    steps = [
        (10, 30, 76, "1: POST /documents/upload (file, unit_code)", False),
        (30, 50, 70, "2: extract_text(file_path)", False),
        (50, 50, 64, "3: page.get_text('text')", True),
        (50, 70, 56, "4: [chars < 50] gpt-4.1-mini vision call", False),
        (70, 50, 48, "5: return transcribed page text", False),
        (50, 30, 40, "6: return full document text", False),
        (30, 90, 32, "7: embed chunks (768d) & insert pgvector", False),
        (90, 30, 24, "8: HTTP 201 Created & Document ID", False),
        (30, 10, 16, "9: Ingestion Complete notification (JSON)", False),
    ]
    for x1, x2, y, msg, self_call in steps:
        if self_call:
            ax.plot([x1, x1+4, x1+4, x1], [y+2, y+2, y-2, y-2], color='#2563EB', lw=1.2)
            ax.text(x1+5, y, msg, fontsize=7.5, color='#1E40AF', va='center')
        else:
            ls = '-' if x1 < x2 else '--'
            draw_arrow(ax, x1, y, x2, y, msg, color='#2563EB' if x1 < x2 else '#059669', lw=1.2, style="->", linestyle=ls)

    fig.savefig(os.path.join(OUT_DIR, "sequence_ingestion.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated sequence_ingestion.png")

# 5. Sequence Diagram: RAG Query
def gen_sequence_rag():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "UML SEQUENCE DIAGRAM - STRICT CONTEXT VECTOR RETRIEVAL & SSE STREAMING", fontsize=11, fontweight='bold', ha='center', color='#0F172A')

    lifelines = [
        (10, "Student / Client"),
        (32, "FastAPI /api/chat"),
        (58, "Supabase RPC\nmatch_documents"),
        (85, "Google Gemini AI\n(gemini-2.5-flash)"),
    ]
    for x, name in lifelines:
        draw_box(ax, x-10, 82, 20, 8, name, color='#1E293B', fontsize=8, radius=1)
        ax.plot([x, x], [82, 10], color='#94A3B8', linestyle='--', lw=1.2)

    steps = [
        (10, 32, 74, "1: POST /api/chat {query, unit_code, mode}", False),
        (32, 85, 66, "2: embed_query(query) -> 768d vector", False),
        (85, 32, 58, "3: return vector float[]", False),
        (32, 58, 50, "4: rpc match_documents(vector, match_count=5)", False),
        (58, 32, 42, "5: return top-5 ranked chunks + citation metadata", False),
        (32, 85, 34, "6: generate_content_stream(context + query)", False),
        (85, 32, 26, "7: stream token chunks", False),
        (32, 10, 18, "8: Server-Sent Events (SSE) Stream to Frontend", False),
    ]
    for x1, x2, y, msg, self_call in steps:
        draw_arrow(ax, x1, y, x2, y, msg, color='#2563EB' if x1 < x2 else '#059669', lw=1.2)

    fig.savefig(os.path.join(OUT_DIR, "sequence_rag_query.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated sequence_rag_query.png")

# 6. Sequence Diagram: Professor Studio
def gen_sequence_lecture():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "UML SEQUENCE DIAGRAM - DYNAMIC PROFESSOR LECTURE STUDIO SYNTHESIS", fontsize=11, fontweight='bold', ha='center', color='#0F172A')

    lifelines = [
        (10, "Professor / Student"),
        (35, "Lecture Studio UI"),
        (62, "FastAPI /professor"),
        (88, "Gemini 2.5 Flash"),
    ]
    for x, name in lifelines:
        draw_box(ax, x-10, 82, 20, 8, name, color='#1E293B', fontsize=8, radius=1)
        ax.plot([x, x], [82, 10], color='#94A3B8', linestyle='--', lw=1.2)

    steps = [
        (10, 35, 74, "1: Select Academic Unit & Filtered Prescribed Book", False),
        (35, 62, 66, "2: GET /api/professor/books?unit_code=SCS3207", False),
        (62, 35, 58, "3: Return Books List (Tanenbaum, Stallings...)", False),
        (10, 35, 50, "4: Click 'Generate 5-Slide Lecture Deck'", False),
        (35, 62, 42, "5: POST /api/professor/generate-lecture {book_id, topic}", False),
        (62, 88, 34, "6: Prompt with Pedagogical Structure & Book Chunks", False),
        (88, 62, 26, "7: Return JSON Slide Deck (Title, Bullet points, Code, Quiz)", False),
        (62, 35, 18, "8: HTTP 200 OK Deck JSON", False),
        (35, 10, 12, "9: Render Interactive Carousel & Quiz UI", False),
    ]
    for x1, x2, y, msg, self_call in steps:
        draw_arrow(ax, x1, y, x2, y, msg, color='#D97706' if 'Lecture' in msg or 'Generate' in msg else '#2563EB', lw=1.2)

    fig.savefig(os.path.join(OUT_DIR, "sequence_lecture_studio.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated sequence_lecture_studio.png")

# 7. UML Activity Diagram: Document Processing
def gen_activity_diagram():
    fig, ax = setup_canvas(10, 8)
    ax.text(50, 96, "UML ACTIVITY DIAGRAM - DOCUMENT INGESTION & PROCESSING LIFECYCLE", fontsize=11, fontweight='bold', ha='center', color='#0F172A')

    # Initial state
    start = patches.Circle((50, 89), 2, facecolor='#0F172A', edgecolor='#0F172A')
    ax.add_patch(start)

    draw_arrow(ax, 50, 87, 50, 81)
    draw_box(ax, 35, 75, 30, 6, "Upload PDF File to Backend", color='#2563EB', radius=1)

    draw_arrow(ax, 50, 75, 50, 69)
    # Decision Diamond
    diamond = patches.Polygon([[50, 69], [55, 65], [50, 61], [45, 65]], closed=True, facecolor='#FEF08A', edgecolor='#854D0E', lw=1.5)
    ax.add_patch(diamond)
    ax.text(50, 65, "Digital Text?", fontsize=7, fontweight='bold', ha='center', va='center')

    # Branch 1: Yes
    draw_arrow(ax, 55, 65, 75, 65, "[Yes: chars > 50]")
    draw_arrow(ax, 75, 65, 75, 55)
    draw_box(ax, 62, 49, 26, 6, "PyMuPDF Direct Text Extraction", color='#059669', radius=1)

    # Branch 2: No
    draw_arrow(ax, 45, 65, 25, 65, "[No: Scanned]")
    draw_arrow(ax, 25, 65, 25, 55)
    draw_box(ax, 12, 49, 26, 6, "Azure OpenAI Vision OCR Fallback", color='#7C3AED', radius=1)

    # Merge
    draw_arrow(ax, 75, 49, 52, 41)
    draw_arrow(ax, 25, 49, 48, 41)
    draw_box(ax, 35, 35, 30, 6, "Clean Text & Semantic Token Chunking", color='#2563EB', radius=1)

    draw_arrow(ax, 50, 35, 50, 29)
    draw_box(ax, 35, 23, 30, 6, "Generate 768d Vector Embeddings", color='#7C3AED', radius=1)

    draw_arrow(ax, 50, 23, 50, 17)
    draw_box(ax, 35, 11, 30, 6, "Upsert to Supabase PostgreSQL pgvector", color='#059669', radius=1)

    draw_arrow(ax, 50, 11, 50, 5)
    end_outer = patches.Circle((50, 3), 2.5, facecolor='none', edgecolor='#0F172A', lw=1.5)
    end_inner = patches.Circle((50, 3), 1.6, facecolor='#0F172A', edgecolor='#0F172A')
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)

    fig.savefig(os.path.join(OUT_DIR, "activity_document_lifecycle.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated activity_document_lifecycle.png")

# 8. State Machine Diagram
def gen_state_machine():
    fig, ax = setup_canvas(11, 6)
    ax.text(50, 94, "UML STATE MACHINE DIAGRAM - DOCUMENT INGESTION LIFECYCLE STATES", fontsize=11, fontweight='bold', ha='center', color='#0F172A')

    states = [
        (8, 60, "INITIAL\nUPLOAD"),
        (28, 60, "PARSING_TEXT\n(PyMuPDF)"),
        (52, 60, "OCR_FALLBACK\n(Vision API)"),
        (76, 60, "CHUNKING\n& EMBEDDING"),
        (76, 20, "INDEXED_READY\n(Live in RAG)"),
        (28, 20, "FAILED_STATE\n(Error Logged)"),
    ]
    for x, y, name in states:
        color = '#059669' if 'INDEXED' in name else '#DC2626' if 'FAILED' in name else '#2563EB'
        draw_box(ax, x, y, 16, 12, name, color=color, radius=3, fontsize=8)

    draw_arrow(ax, 24, 66, 28, 66, "File Received")
    draw_arrow(ax, 44, 66, 52, 66, "[chars < 50]")
    draw_arrow(ax, 68, 66, 76, 66, "Text Ready")
    draw_arrow(ax, 36, 60, 76, 70, "[chars >= 50] Skip OCR", rad=0.2)
    draw_arrow(ax, 84, 60, 84, 32, "Upsert OK")
    draw_arrow(ax, 60, 60, 44, 28, "Exception / Timeout", color='#DC2626', rad=0.1)

    fig.savefig(os.path.join(OUT_DIR, "state_machine_document.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated state_machine_document.png")

# 9. UML Domain Class Diagram
def gen_class_diagram():
    fig, ax = setup_canvas(12, 7.5)
    ax.text(50, 95, "UML DOMAIN CLASS DIAGRAM - EDURAG SCHOLAR OBJECT MODEL", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    classes = [
        (5, 52, 26, 38, "Document", [
            "- id: UUID",
            "- unit_code: String",
            "- title: String",
            "- file_type: String",
            "- page_count: Integer",
            "- uploaded_by: UUID",
            "- is_processed: Boolean"
        ], [
            "+ extract_content()",
            "+ delete_cascade()",
            "+ get_summary()"
        ]),
        (38, 52, 26, 38, "DocumentChunk", [
            "- id: UUID",
            "- document_id: UUID",
            "- chunk_index: Integer",
            "- content: Text",
            "- embedding: vector(768)",
            "- token_count: Integer",
            "- page_number: Integer"
        ], [
            "+ compute_similarity()",
            "+ get_citation_label()"
        ]),
        (71, 52, 26, 38, "AcademicUnit", [
            "- unit_code: String",
            "- unit_name: String",
            "- year_of_study: Integer",
            "- semester: Integer",
            "- description: Text"
        ], [
            "+ get_active_documents()",
            "+ get_prescribed_books()"
        ]),
        (5, 5, 26, 38, "ChatMessage", [
            "- id: UUID",
            "- session_id: UUID",
            "- sender: String",
            "- content: Text",
            "- citations: JSONB",
            "- created_at: Timestamp"
        ], [
            "+ stream_response()",
            "+ render_markdown()"
        ]),
        (38, 5, 26, 38, "LectureSession", [
            "- id: UUID",
            "- unit_code: String",
            "- book_id: UUID",
            "- topic: String",
            "- slide_count: Integer",
            "- created_at: Timestamp"
        ], [
            "+ generate_deck()",
            "+ export_pdf()"
        ]),
        (71, 5, 26, 38, "LectureSlide", [
            "- slide_number: Integer",
            "- title: String",
            "- bullet_points: List[Str]",
            "- key_takeaway: String",
            "- quiz_question: String",
            "- quiz_options: List[Str]"
        ], [
            "+ evaluate_quiz()",
            "+ render_slide()"
        ])
    ]

    for x, y, w, h, name, attrs, methods in classes:
        rect = patches.Rectangle((x, y), w, h, facecolor='white', edgecolor='#1E3A8A', lw=1.5, zorder=2)
        ax.add_patch(rect)
        # Title bar
        t_bar = patches.Rectangle((x, y+h-7), w, 7, facecolor='#1E3A8A', edgecolor='#1E3A8A', zorder=3)
        ax.add_patch(t_bar)
        ax.text(x+w/2, y+h-3.5, name, color='white', fontsize=9, fontweight='bold', ha='center', va='center', zorder=4)

        # Attrs
        ay = y + h - 10
        for a in attrs:
            ax.text(x+1.5, ay, a, fontsize=6.8, color='#0F172A', zorder=4)
            ay -= 3.2
        # Divider
        ax.plot([x, x+w], [ay+1, ay+1], color='#CBD5E1', lw=1, zorder=4)
        ay -= 3
        # Methods
        for m in methods:
            ax.text(x+1.5, ay, m, fontsize=6.8, color='#0369A1', zorder=4)
            ay -= 3.2

    # Associations
    ax.plot([31, 38], [71, 71], color='#0F172A', lw=1.5) # Doc -> Chunk (1 to N)
    ax.text(32, 73, "1", fontsize=8, fontweight='bold')
    ax.text(36, 73, "1..*", fontsize=8, fontweight='bold')

    ax.plot([64, 71], [71, 71], color='#0F172A', lw=1.5) # Chunk -> Unit
    ax.text(65, 73, "*", fontsize=8, fontweight='bold')
    ax.text(69, 73, "1", fontsize=8, fontweight='bold')

    ax.plot([64, 71], [24, 24], color='#0F172A', lw=1.5) # Lecture -> Slide
    ax.text(65, 26, "1", fontsize=8, fontweight='bold')
    ax.text(69, 26, "1..*", fontsize=8, fontweight='bold')

    fig.savefig(os.path.join(OUT_DIR, "class_diagram.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated class_diagram.png")

# 10. Relational ERD
def gen_relational_erd():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "RELATIONAL ENTITY-RELATIONSHIP DIAGRAM (ERD) - 3NF SCHEMA", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    tables = [
        (5, 50, 24, 38, "documents", [
            "PK  id: uuid",
            "FK  uploaded_by: uuid",
            "FK  unit_code: varchar",
            "    title: varchar",
            "    file_type: varchar",
            "    file_size_bytes: bigint",
            "    page_count: int",
            "    is_processed: boolean",
            "    uploaded_at: timestamptz"
        ]),
        (38, 50, 24, 38, "document_chunks", [
            "PK  id: uuid",
            "FK  document_id: uuid",
            "    chunk_index: int",
            "    chunk_text: text",
            "    embedding: vector(768)",
            "    page_number: int",
            "    token_count: int",
            "    created_at: timestamptz"
        ]),
        (71, 50, 24, 38, "academic_units", [
            "PK  unit_code: varchar(10)",
            "    title: varchar(255)",
            "    department: varchar",
            "    year: int",
            "    semester: int"
        ]),
        (5, 5, 24, 38, "chat_sessions", [
            "PK  id: uuid",
            "FK  user_id: uuid",
            "FK  unit_code: varchar",
            "    title: varchar",
            "    created_at: timestamptz"
        ]),
        (38, 5, 24, 38, "chat_messages", [
            "PK  id: uuid",
            "FK  session_id: uuid",
            "    role: varchar(20)",
            "    content: text",
            "    citations: jsonb",
            "    created_at: timestamptz"
        ]),
        (71, 5, 24, 38, "lecture_decks", [
            "PK  id: uuid",
            "FK  user_id: uuid",
            "FK  unit_code: varchar",
            "    topic: varchar",
            "    deck_json: jsonb",
            "    created_at: timestamptz"
        ])
    ]

    for x, y, w, h, name, cols in tables:
        rect = patches.Rectangle((x, y), w, h, facecolor='white', edgecolor='#059669', lw=1.5, zorder=2)
        ax.add_patch(rect)
        t_bar = patches.Rectangle((x, y+h-6), w, 6, facecolor='#059669', edgecolor='#059669', zorder=3)
        ax.add_patch(t_bar)
        ax.text(x+w/2, y+h-3, name, color='white', fontsize=8.5, fontweight='bold', ha='center', va='center', zorder=4)
        cy = y + h - 9
        for c in cols:
            prefix = c[:4]
            rest = c[4:]
            color = '#DC2626' if 'PK' in prefix else '#2563EB' if 'FK' in prefix else '#0F172A'
            ax.text(x+1.5, cy, prefix, fontsize=6.8, fontweight='bold', color=color, zorder=4)
            ax.text(x+6, cy, rest, fontsize=6.8, color='#334155', zorder=4)
            cy -= 3.2

    # Cardinality lines (Crow's foot style)
    ax.plot([29, 38], [72, 72], color='#0F172A', lw=1.5)
    ax.text(30, 74, "1", fontsize=9, fontweight='bold')
    ax.text(36, 74, "∞", fontsize=11, fontweight='bold')

    ax.plot([62, 71], [72, 72], color='#0F172A', lw=1.5)
    ax.text(63, 74, "∞", fontsize=11, fontweight='bold')
    ax.text(69, 74, "1", fontsize=9, fontweight='bold')

    ax.plot([29, 38], [24, 24], color='#0F172A', lw=1.5)
    ax.text(30, 26, "1", fontsize=9, fontweight='bold')
    ax.text(36, 26, "∞", fontsize=11, fontweight='bold')

    fig.savefig(os.path.join(OUT_DIR, "erd_relational_schema.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated erd_relational_schema.png")

# 11. Architecture 4+1 View
def gen_architecture():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "IEEE 42010 / 4+1 ARCHITECTURAL VIEW & CLOUD TOPOLOGY", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    # Views
    draw_box(ax, 5, 52, 42, 38, "LOGICAL VIEW\n• FastAPI Clean Architecture\n• Multi-tenant Tenant Isolation\n• Ingestion, VectorStore, Gemini Agents\n• Dependency Injection & Repositories", title="1. LOGICAL VIEW", color='#1E40AF', radius=2)
    draw_box(ax, 53, 52, 42, 38, "PROCESS VIEW\n• Non-blocking Async I/O (ASGI/Uvicorn)\n• SSE Token Streaming for Low Latency\n• OCR Background Thread Fallback\n• Parallel Vector Similarity Search", title="2. PROCESS VIEW", color='#0369A1', radius=2)
    draw_box(ax, 5, 8, 42, 38, "DEVELOPMENT VIEW\n• Frontend: React 18 + Vite + TailwindCSS\n• Backend: Python 3.12 + FastAPI + PyMuPDF\n• Strict Linting & Type Safety (Pydantic v2)\n• GitHub Version Control & Workflows", title="3. DEVELOPMENT VIEW", color='#4338CA', radius=2)
    draw_box(ax, 53, 8, 42, 38, "PHYSICAL DEPLOYMENT VIEW\n• Frontend: Vercel Global Edge CDN\n• Backend: Azure App Service (Linux B1 Container)\n• Database: Supabase Managed pgvector\n• AI Inference: Google Gemini 2.5 Flash", title="4. PHYSICAL VIEW", color='#047857', radius=2)

    # Scenarios center
    draw_box(ax, 38, 42, 24, 16, "+1 SCENARIOS\n• Live Exam Revision\n• Scanned Handout OCR\n• Dynamic Slide Deck", color='#B45309', radius=2, fontsize=8)

    fig.savefig(os.path.join(OUT_DIR, "architecture_4plus1.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated architecture_4plus1.png")

# 12. Testing Pyramid
def gen_testing_pyramid():
    fig, ax = setup_canvas(10, 6.5)
    ax.text(50, 94, "SOFTWARE QUALITY ASSURANCE - TESTING PYRAMID (IEEE 829)", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    # Pyramid tiers
    poly_e2e = patches.Polygon([[50, 85], [42, 68], [58, 68]], facecolor='#DC2626', edgecolor='#0F172A', lw=1.5)
    poly_int = patches.Polygon([[42, 68], [34, 46], [66, 46], [58, 68]], facecolor='#D97706', edgecolor='#0F172A', lw=1.5)
    poly_unit = patches.Polygon([[34, 46], [22, 18], [78, 18], [66, 46]], facecolor='#059669', edgecolor='#0F172A', lw=1.5)

    ax.add_patch(poly_unit)
    ax.add_patch(poly_int)
    ax.add_patch(poly_e2e)

    ax.text(50, 73, "E2E & UI Tests\n(Playwright/Selenium)\n~10% of Test Suite", color='white', fontsize=8, fontweight='bold', ha='center', va='center')
    ax.text(50, 56, "Integration & API Tests\n(FastAPI TestClient, Supabase RPC, Multi-tenant Isolation)\n~30% of Test Suite", color='white', fontsize=8, fontweight='bold', ha='center', va='center')
    ax.text(50, 32, "Unit & Component Tests\n(PyTest, Extractor, Chunker, Gemini Mock, Token Counter)\n~60% of Test Suite", color='white', fontsize=8.5, fontweight='bold', ha='center', va='center')

    # Side annotations
    ax.text(82, 75, "High Cost\nSlow Execution", color='#991B1B', fontsize=8, fontweight='bold', ha='left')
    ax.text(82, 32, "Fast Execution\nAutomated in CI", color='#065F46', fontsize=8, fontweight='bold', ha='left')

    fig.savefig(os.path.join(OUT_DIR, "testing_pyramid.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated testing_pyramid.png")

# 13. STRIDE Threat Model
def gen_stride():
    fig, ax = setup_canvas(12, 7)
    ax.text(50, 95, "SECOPS STRIDE THREAT MODELING & SECURITY PERIMETER", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    threats = [
        (5, 52, 27, 36, "S - Spoofing", "Threat: Impersonating student/professor\nMitigation: Supabase JWT Auth with RS256 signatures, validated on every FastAPI request.", '#DC2626'),
        (36, 52, 27, 36, "T - Tampering", "Threat: Modifying ingested notes or chunks\nMitigation: Row Level Security (RLS) on PostgreSQL, immutable chunk hashes, read-only search.", '#EA580C'),
        (68, 52, 27, 36, "R - Repudiation", "Threat: User denies deleting document\nMitigation: Comprehensive audit logging in Azure App Insights with user_id, timestamp, IP.", '#D97706'),
        (5, 8, 27, 36, "I - Information Disclosure", "Threat: Cross-tenant data leakage\nMitigation: Strict tenant isolation: queries enforce eq('uploaded_by', current_user_id).", '#4F46E5'),
        (36, 8, 27, 36, "D - Denial of Service", "Threat: Ingestion overload / prompt flood\nMitigation: Rate limiting, chunk payload size caps (50MB), async non-blocking background OCR.", '#7C3AED'),
        (68, 8, 27, 36, "E - Elevation of Privilege", "Threat: Scholar executes admin/delete API\nMitigation: RBAC role verification in backend router before sensitive endpoints execute.", '#059669'),
    ]

    for x, y, w, h, title, desc, col in threats:
        draw_box(ax, x, y, w, h, desc, title=title, color=col, radius=2, fontsize=8)

    fig.savefig(os.path.join(OUT_DIR, "stride_threat_model.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated stride_threat_model.png")

# 14. DevOps CI/CD Pipeline
def gen_devops():
    fig, ax = setup_canvas(12, 6)
    ax.text(50, 94, "DEVOPS CI/CD DEPLOYMENT PIPELINE & AUTOMATION ARCHITECTURE", fontsize=12, fontweight='bold', ha='center', color='#0F172A')

    stages = [
        (5, 38, 15, 24, "1. Git Push\nGitHub main branch", '#1E293B'),
        (23, 38, 16, 24, "2. GitHub Actions\nLint & PyTest Suite", '#2563EB'),
        (42, 38, 16, 24, "3. Build & Package\nDocker / Node Bundle", '#7C3AED'),
        (61, 38, 16, 24, "4. Vercel Deploy\nGlobal Edge Frontend", '#0284C7'),
        (80, 38, 16, 24, "5. Azure Deploy\nApp Service Webhook", '#059669'),
    ]
    for x, y, w, h, text, col in stages:
        draw_box(ax, x, y, w, h, text, color=col, radius=2, fontsize=8)

    draw_arrow(ax, 20, 50, 23, 50)
    draw_arrow(ax, 39, 50, 42, 50)
    draw_arrow(ax, 58, 50, 61, 50)
    draw_arrow(ax, 77, 50, 80, 50)

    # Bottom notes
    ax.text(50, 18, "• Zero-Downtime Rolling Deployment with Health Checks on /health\n• Automatic Environment Variable Injection from Azure KeyVault / GitHub Secrets\n• Rollback capability within 60 seconds upon container startup failure",
            fontsize=8.5, ha='center', va='center', color='#334155',
            bbox=dict(boxstyle="round,pad=0.5", facecolor='#F1F5F9', edgecolor='#94A3B8', lw=1))

    fig.savefig(os.path.join(OUT_DIR, "devops_cicd_pipeline.png"), bbox_inches='tight')
    plt.close(fig)
    print("Generated devops_cicd_pipeline.png")

if __name__ == "__main__":
    gen_dfd_level_0()
    gen_dfd_level_1()
    gen_use_case()
    gen_sequence_ingestion()
    gen_sequence_rag()
    gen_sequence_lecture()
    gen_activity_diagram()
    gen_state_machine()
    gen_class_diagram()
    gen_relational_erd()
    gen_architecture()
    gen_testing_pyramid()
    gen_stride()
    gen_devops()
    print("ALL 14 SDLC DIAGRAMS GENERATED SUCCESSFULLY IN docs/diagrams/!")
