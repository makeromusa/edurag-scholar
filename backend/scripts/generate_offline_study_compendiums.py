import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

OUTPUT_DIR = os.path.abspath("docs/offline_study")
DOWNLOADS_DIR = r"C:\Users\HomePC\Downloads"
ARTIFACTS_DIR = r"C:\Users\HomePC\.gemini\antigravity\brain\1ba367e5-cd11-4f15-a384-d415d1506ec6"

os.makedirs(OUTPUT_DIR, exist_ok=True)

class OfflineNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # skip cover
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(54, 755, "UNIVERSITY OF NAIROBI | CHIROMO CAMPUS | YEAR 2 CS OFFLINE STUDY COMPENDIUM")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(54, 747, 558, 747)

        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "Strict Model Solutions & High-Yield Formulas — Offline Exam Revision Manual")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 34, page_text)
        self.line(54, 46, 558, 46)
        self.restoreState()

def get_study_styles():
    styles = getSampleStyleSheet()
    primary = "#0F172A"
    accent = "#1D4ED8"
    emerald = "#047857"

    title_style = ParagraphStyle(
        'StudyTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=22, leading=26,
        textColor=colors.HexColor(primary), spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'StudySubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=11, leading=15,
        textColor=colors.HexColor("#475569"), spaceAfter=16
    )
    h1_style = ParagraphStyle(
        'StudyH1', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=colors.HexColor(accent), spaceBefore=14, spaceAfter=8, keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'StudyH2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=11, leading=15,
        textColor=colors.HexColor(primary), spaceBefore=10, spaceAfter=5, keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'StudyH3', parent=styles['Heading3'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=13,
        textColor=colors.HexColor(emerald), spaceBefore=8, spaceAfter=4, keepWithNext=True
    )
    body_style = ParagraphStyle(
        'StudyBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12.5,
        textColor=colors.HexColor("#1E293B"), spaceAfter=5
    )
    bullet_style = ParagraphStyle(
        'StudyBullet', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12.5,
        textColor=colors.HexColor("#1E293B"), leftIndent=12, firstLineIndent=-8, spaceAfter=3
    )
    question_style = ParagraphStyle(
        'StudyQ', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, leading=13,
        textColor=colors.HexColor("#1E3A8A"), spaceBefore=6, spaceAfter=4, keepWithNext=True
    )
    answer_style = ParagraphStyle(
        'StudyAns', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.3, leading=12,
        textColor=colors.HexColor("#0F172A"), spaceBefore=3, spaceAfter=5
    )
    code_style = ParagraphStyle(
        'StudyCode', parent=styles['Normal'],
        fontName='Courier', fontSize=7.2, leading=9.5,
        textColor=colors.HexColor("#0F172A"), spaceBefore=3, spaceAfter=5
    )
    meta_style = ParagraphStyle(
        'StudyMeta', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=12,
        textColor=colors.HexColor("#0284C7"),
    )
    trap_style = ParagraphStyle(
        'StudyTrap', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=8, leading=11.5,
        textColor=colors.HexColor("#B91C1C"), spaceBefore=3, spaceAfter=4
    )
    return {
        'title': title_style, 'subtitle': subtitle_style, 'h1': h1_style,
        'h2': h2_style, 'h3': h3_style, 'body': body_style,
        'bullet': bullet_style, 'q': question_style, 'ans': answer_style,
        'code': code_style, 'meta': meta_style, 'trap': trap_style
    }

def add_cover(story, styles, title, subtitle, target_units, author="Asman Makero Musa (P15/XXXXX/2024)"):
    story.append(Spacer(1, 35))
    story.append(Paragraph("UNIVERSITY OF NAIROBI — FACULTY OF SCIENCE & TECHNOLOGY", styles['meta']))
    story.append(Paragraph("DEPARTMENT OF COMPUTING & INFORMATICS | CHIROMO CAMPUS", styles['meta']))
    story.append(Spacer(1, 15))
    story.append(Paragraph(title.upper(), styles['title']))
    story.append(Paragraph(subtitle, styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#1D4ED8"), spaceAfter=16))

    meta_table_data = [
        [Paragraph("<b>Curriculum Year & Scope:</b>", styles['body']), Paragraph("<b>Bachelor of Science in Computer Science — Year 2 (Full Scope)</b>", styles['body'])],
        [Paragraph("<b>Academic Units Covered:</b>", styles['body']), Paragraph(target_units, styles['body'])],
        [Paragraph("<b>Examinations Solved:</b>", styles['body']), Paragraph("UoN Semester Examinations & CATs (2018, 2019, 2024, 2025, 2026)", styles['body'])],
        [Paragraph("<b>Primary Prescribed Texts:</b>", styles['body']), Paragraph("• Tanenbaum (OS 4th ed.) | Stallings (OS 9th ed.)<br/>• Stallings (Comp Arch 10th ed.) | Patterson & Hennessy (MIPS)<br/>• Russell & Norvig (AIMA 3rd ed.) | Akerkar (KBS)<br/>• Forouzan (Networks 4th ed.) | Comer (Networks 6th ed.)<br/>• Kendall & Kendall (SAD 10th ed.) | Sommerville (SE 9th/10th ed.)", styles['body'])],
        [Paragraph("<b>Student Author:</b>", styles['body']), Paragraph(author, styles['body'])],
        [Paragraph("<b>Offline Readiness:</b>", styles['body']), Paragraph("<b>100% SELF-CONTAINED — NO INTERNET CONNECTION REQUIRED</b>", styles['body'])],
    ]
    t = Table(meta_table_data, colWidths=[2.0*inch, 5.0*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(PageBreak())

def render_table(story, data, col_widths, styles, is_header=True):
    formatted = []
    for r_idx, row in enumerate(data):
        row_cells = []
        for c_idx, cell in enumerate(row):
            if r_idx == 0 and is_header:
                p = Paragraph(f"<b>{cell}</b>", ParagraphStyle('TH', parent=styles['body'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
            else:
                p = Paragraph(str(cell), ParagraphStyle('TD', parent=styles['body'], fontName='Helvetica', fontSize=7.8, leading=10.5))
            row_cells.append(p)
        formatted.append(row_cells)
    
    t = Table(formatted, colWidths=col_widths)
    t_style = [
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]
    if is_header:
        t_style.append(('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")))
    t.setStyle(TableStyle(t_style))
    story.append(t)
    story.append(Spacer(1, 6))

def compile_pdf(filename, story):
    out_path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(out_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    doc.build(story, canvasmaker=OfflineNumberedCanvas)
    
    dl_path = os.path.join(DOWNLOADS_DIR, filename)
    shutil.copy2(out_path, dl_path)
    
    if os.path.exists(ARTIFACTS_DIR):
        shutil.copy2(out_path, os.path.join(ARTIFACTS_DIR, filename))
        
    print(f"-> Generated {filename} ({os.path.getsize(out_path)/(1024):.1f} KB)")
    return out_path

# ==============================================================================
# 1. MASTER PAST EXAMS SOLVED COMPENDIUM (2018 - 2026)
# ==============================================================================
def build_master_exams_compendium():
    styles = get_study_styles()
    story = []
    add_cover(
        story, styles,
        "UoN Chiromo Year 2: Master Past Exam Papers Solved Compendium (2018–2026)",
        "Exhaustive Step-by-Step Model Marking Scheme Solutions, Mathematical Derivations & Algorithmic Proofs Across All Year 2 Examinations",
        "• SCS 3207: Operating Systems<br/>• SCS 3203: Computer Architecture<br/>• SCS 3205: Knowledge-Based Systems & Programming<br/>• SMA 2114: Differential & Integral Calculus<br/>• CSC 3211: Computer Networks"
    )

    # --------------------------------------------------------------------------
    # PART 1: OPERATING SYSTEMS (SCS 3207)
    # --------------------------------------------------------------------------
    story.append(Paragraph("PART 1: SCS 3207 — OPERATING SYSTEMS (SOLVED EXAMS & CATS)", styles['h1']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1D4ED8"), spaceAfter=10))

    story.append(Paragraph("<b>Examination: UoN SCS 3207 Operating Systems — January 26, 2026</b>", styles['h2']))
    story.append(Paragraph("<b>Question 1 (a) [6 Marks]:</b> Explain the dual-mode operation of modern CPUs (User Mode vs. Kernel Mode). Illustrate how mode switching occurs during a system call with the hardware Mode Bit.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "<b>1. Architectural Purpose:</b> Dual-mode operation prevents rogue user-level programs from directly executing privileged I/O instructions, halting the CPU, or corrupting physical memory allocated to other processes or the kernel.<br/>"
                           "<b>2. Privilege Levels & Mode Bit:</b><br/>"
                           "• <b>User Mode (Mode Bit = 1):</b> The CPU executes unprivileged instructions. Direct access to physical hardware, MMU page tables, and I/O ports is prohibited.<br/>"
                           "• <b>Kernel / Supervisor Mode (Mode Bit = 0):</b> The CPU has unrestricted access to the entire memory space and all privileged instructions (e.g., `CLI`, `STI`, `LIDT`, `IN/OUT`).<br/>"
                           "<b>3. Mode Transition Sequence (Step-by-Step):</b><br/>"
                           "1. User process invokes a library wrapper (e.g., `read()` in POSIX).<br/>"
                           "2. Wrapper places the system call number in register (e.g., `EAX`/`RAX` on x86) and parameters in registers.<br/>"
                           "3. The software trap/interrupt instruction (`SYSCALL` or `INT 0x80`) is executed.<br/>"
                           "4. <b>Hardware Action:</b> Hardware automatically saves User PC and Processor Status Word (PSW), switches the <b>Mode Bit from 1 to 0</b>, and jumps to the System Call Dispatcher address via the Interrupt Descriptor Table (IDT).<br/>"
                           "5. Kernel executes service routine, checks parameters for safety, writes return code to register.<br/>"
                           "6. Kernel executes `SYSRET` or `IRET`: hardware restores User PSW, flips <b>Mode Bit back from 0 to 1</b>, and resumes user execution at next instruction.", styles['ans']))

    story.append(Paragraph("<b>Question 3 (a) [15 Marks]:</b> A counting semaphore <code>S</code> has an initial value of -2, and two processes <code>P2</code> and <code>P3</code> are in its waiting queue where <code>P2</code> is ahead of <code>P3</code>. Another process <code>P1</code> executes <code>signal(S)</code> (or <code>V(S)</code>), followed by process <code>P4</code> executing <code>wait(S)</code> (or <code>P(S)</code>).<br/>"
                           "(i) Trace the value of semaphore <code>S</code> after each operation.<br/>"
                           "(ii) What is the state of the waiting queue at each step?<br/>"
                           "(iii) Which process is unblocked, and when?", styles['q']))
    
    sem_table_data = [
        ["Step #", "Action Executed", "Value of Semaphore S", "Waiting Queue (FIFO)", "Process State Transition & Explanation"],
        ["Initial", "System State", "S = -2", "[P2, P3]", "Negative count indicates 2 processes waiting. P2 is head of queue."],
        ["Step 1", "P1 executes signal(S)", "S = -2 + 1 = -1", "[P3]", "S <= 0 triggers unblocking of head process. <b>P2 is unblocked</b> and moved to Ready queue. P3 remains waiting."],
        ["Step 2", "P4 executes wait(S)", "S = -1 - 1 = -2", "[P3, P4]", "S < 0 causes calling process P4 to block. <b>P4 is placed at tail of waiting queue</b> behind P3."]
    ]
    render_table(story, sem_table_data, [0.6*inch, 1.4*inch, 1.2*inch, 1.2*inch, 2.6*inch], styles)

    story.append(Paragraph("<b>Question 2 (b) [10 Marks]:</b> Consider 5 processes P0 through P4 and 3 resource types A (10 instances), B (5 instances), C (7 instances). Current allocation is P0(0,1,0), P1(2,0,0), P2(3,0,2), P3(2,1,1), P4(0,0,2). Max demand is P0(7,5,3), P1(3,2,2), P2(9,0,2), P3(2,2,2), P4(4,3,3). Determine if the system is in a safe state using <b>Banker's Algorithm</b>.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "<b>1. Calculate Total Allocated:</b><br/>"
                           "Total A = 0 + 2 + 3 + 2 + 0 = 7. Total B = 1 + 0 + 0 + 1 + 0 = 2. Total C = 0 + 0 + 2 + 1 + 2 = 5.<br/>"
                           "<b>2. Calculate Available Vector:</b><br/>"
                           "Available = Total Instances - Total Allocated = (10 - 7, 5 - 2, 7 - 5) = <b>(3, 3, 2)</b>.<br/>"
                           "<b>3. Calculate Need Matrix (Need = Max - Allocation):</b><br/>"
                           "• Need(P0) = (7,5,3) - (0,1,0) = (7, 4, 3)<br/>"
                           "• Need(P1) = (3,2,2) - (2,0,0) = (1, 2, 2)<br/>"
                           "• Need(P2) = (9,0,2) - (3,0,2) = (6, 0, 0)<br/>"
                           "• Need(P3) = (2,2,2) - (2,1,1) = (0, 1, 1)<br/>"
                           "• Need(P4) = (4,3,3) - (0,0,2) = (4, 3, 1)<br/>"
                           "<b>4. Safety Algorithm Execution Trace:</b><br/>"
                           "• Work = (3, 3, 2). Check P0: Need (7,4,3) <= Work? No. (Wait)<br/>"
                           "• Check P1: Need (1,2,2) <= Work (3,3,2)? <b>YES!</b> P1 completes. Work = (3,3,2) + Allocation(P1)(2,0,0) = <b>(5, 3, 2)</b>.<br/>"
                           "• Check P3: Need (0,1,1) <= Work (5,3,2)? <b>YES!</b> P3 completes. Work = (5,3,2) + Allocation(P3)(2,1,1) = <b>(7, 4, 3)</b>.<br/>"
                           "• Check P4: Need (4,3,1) <= Work (7,4,3)? <b>YES!</b> P4 completes. Work = (7,4,3) + Allocation(P4)(0,0,2) = <b>(7, 4, 5)</b>.<br/>"
                           "• Check P0: Need (7,4,3) <= Work (7,4,5)? <b>YES!</b> P0 completes. Work = (7,4,5) + Allocation(P0)(0,1,0) = <b>(7, 5, 5)</b>.<br/>"
                           "• Check P2: Need (6,0,0) <= Work (7,5,5)? <b>YES!</b> P2 completes. Work = (7,5,5) + Allocation(P2)(3,0,2) = <b>(10, 5, 7)</b>.<br/>"
                           "<b>Verdict:</b> All processes finish. The system is in a <b>SAFE STATE</b>. Safe sequence: <b>&lt;P1, P3, P4, P0, P2&gt;</b>.", styles['ans']))

    story.append(Spacer(1, 10))

    # --------------------------------------------------------------------------
    # PART 2: COMPUTER ARCHITECTURE (SCS 3203)
    # --------------------------------------------------------------------------
    story.append(Paragraph("PART 2: SCS 3203 — COMPUTER ARCHITECTURE (SOLVED EXAMS & CATS)", styles['h1']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1D4ED8"), spaceAfter=10))

    story.append(Paragraph("<b>Examination: UoN SCS 3203 Computer Architecture — January 20, 2026</b>", styles['h2']))
    story.append(Paragraph("<b>Question 1 (b) [6 Marks]:</b> Describe the three cache mapping techniques (Direct, Fully Associative, and Set Associative). Compare them in terms of hardware complexity and cache miss rate.", styles['q']))
    
    cache_comp_data = [
        ["Mapping Technique", "Address Bit Division", "Placement Rule", "Miss Rate (Conflict)", "Hardware Complexity & Search"],
        ["Direct Mapped", "Tag | Line Index | Word Offset", "Block mapped to exactly one cache line: line = (Block #) mod (Total Lines)", "Highest (frequent conflict misses when multiple blocks compete for same line)", "Lowest (Single comparator; instantaneous look-up)."],
        ["Fully Associative", "Tag | Word Offset", "Block can be placed anywhere in cache.", "Lowest (Zero conflict misses; only compulsory & capacity misses)", "Highest (Requires parallel comparators for every single cache line; high silicon cost)."],
        ["Set Associative (k-way)", "Tag | Set Index | Word Offset", "Cache divided into S sets of k lines. Block maps to set: set = (Block #) mod S", "Balanced (drastically lowers conflict misses over direct mapping)", "Moderate (Requires k comparators operating in parallel; industry standard)."]
    ]
    render_table(story, cache_comp_data, [1.1*inch, 1.4*inch, 1.7*inch, 1.4*inch, 1.4*inch], styles)

    story.append(Paragraph("<b>Question 2 (a) [8 Marks]:</b> Using <b>Booth's Algorithm</b>, compute the product of Multiplicand M = -5 (1011 in 4-bit 2's complement) and Multiplier Q = +3 (0011 in 4-bit 2's complement). Show the step-by-step register contents of A, Q, Q-1.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "Multiplicand M = 1011 (-5). Negative of M (-M) = 0101 (+5). Multiplier Q = 0011 (+3).<br/>"
                           "Registers: A = 0000, Q = 0011, Q-1 = 0. Count = 4.", styles['ans']))

    booth_data = [
        ["Cycle #", "Action Taken", "Register A", "Register Q", "Q-1", "Count Remaining"],
        ["Init", "Initialize registers", "0000", "0011", "0", "4"],
        ["Cycle 1", "Q0 Q-1 = 10 -> A = A - M (A + 0101 = 0101)<br/>Arithmetic Shift Right (ASR)", "0101<br/><b>0010</b>", "0011<br/><b>1001</b>", "0<br/><b>1</b>", "3"],
        ["Cycle 2", "Q0 Q-1 = 11 -> No arithmetic op<br/>Arithmetic Shift Right (ASR)", "0010<br/><b>0001</b>", "1001<br/><b>1100</b>", "1<br/><b>1</b>", "2"],
        ["Cycle 3", "Q0 Q-1 = 01 -> A = A + M (A + 1011 = 1100)<br/>Arithmetic Shift Right (ASR)", "1100<br/><b>1110</b>", "1100<br/><b>0110</b>", "1<br/><b>0</b>", "1"],
        ["Cycle 4", "Q0 Q-1 = 00 -> No arithmetic op<br/>Arithmetic Shift Right (ASR)", "1110<br/><b>1111</b>", "0110<br/><b>0011</b>", "0<br/><b>0</b>", "0 (Done)"]
    ]
    render_table(story, booth_data, [0.8*inch, 2.4*inch, 1.0*inch, 1.0*inch, 0.6*inch, 1.2*inch], styles)
    story.append(Paragraph("<b>Result Concatenation:</b> A:Q = <code>1111 0001</code>.<br/>"
                           "In 8-bit 2's complement: 2's complement of 1111 0001 is (0000 1110 + 1) = 0000 1111 = 15. Hence, 1111 0001 = <b>-15</b>.<br/>"
                           "<b>Proof:</b> (-5) * (+3) = -15. <b>CORRECT.</b>", styles['ans']))

    story.append(Spacer(1, 10))

    # --------------------------------------------------------------------------
    # PART 3: KNOWLEDGE-BASED SYSTEMS (SCS 3205)
    # --------------------------------------------------------------------------
    story.append(Paragraph("PART 3: SCS 3205 — KNOWLEDGE-BASED SYSTEMS & PROGRAMMING", styles['h1']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1D4ED8"), spaceAfter=10))

    story.append(Paragraph("<b>Examination: UoN SCS 3205 Knowledge-Based Systems — January 22, 2026</b>", styles['h2']))
    story.append(Paragraph("<b>Question 1 (c) [8 Marks]:</b> Transform the following First-Order Logic (FOL) statement into Conjunctive Normal Form (CNF) clauses: <i>'Every student who studies hard passes their exams or is lucky.'</i> Show all standard conversion steps.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "<b>Step 1 (Formalize in FOL):</b><br/>"
                           "∀x [ (Student(x) ∧ StudiesHard(x)) → (PassesExam(x) ∨ Lucky(x)) ]<br/>"
                           "<b>Step 2 (Eliminate Implication P → Q ≡ ¬P ∨ Q):</b><br/>"
                           "∀x [ ¬(Student(x) ∧ StudiesHard(x)) ∨ (PassesExam(x) ∨ Lucky(x)) ]<br/>"
                           "<b>Step 3 (Apply De Morgan's Law to push negation inward):</b><br/>"
                           "∀x [ ¬Student(x) ∨ ¬StudiesHard(x) ∨ PassesExam(x) ∨ Lucky(x) ]<br/>"
                           "<b>Step 4 (Standardize Variables):</b> Variable x is already unique.<br/>"
                           "<b>Step 5 (Skolemization):</b> No existential quantifiers (∃) exist. No Skolem functions needed.<br/>"
                           "<b>Step 6 (Drop Universal Quantifiers):</b><br/>"
                           "¬Student(x) ∨ ¬StudiesHard(x) ∨ PassesExam(x) ∨ Lucky(x)<br/>"
                           "<b>Final CNF Clause:</b> <code>{ ¬Student(x), ¬StudiesHard(x), PassesExam(x), Lucky(x) }</code> (Single disjunctive clause).", styles['ans']))

    story.append(Paragraph("<b>Question 2 (a) [6 Marks]:</b> Explain the execution semantics of the Prolog cut operator (<code>!</code>). Give an example illustrating green cut vs. red cut.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "<b>1. Semantics of Cut (!):</b> The cut operator commits Prolog to all choices made since the parent goal was unified with the clause head. It prunes all alternative choice points for goals preceding the cut and prevents backtracking into subsequent alternative clauses for the same predicate.<br/>"
                           "<b>2. Green Cut (Safe / Efficiency):</b><br/>"
                           "• Prunes redundant search branches without altering the declarative meaning of the program.<br/>"
                           "• Example: <code>max(X, Y, X) :- X >= Y, !. max(X, Y, Y) :- X < Y.</code> (The cut purely prevents checking X < Y when X >= Y is already proven).<br/>"
                           "<b>3. Red Cut (Hazardous / Procedural):</b><br/>"
                           "• Alters the logical declarative semantics. Removing the cut changes the truth set of solutions.<br/>"
                           "• Example: <code>max(X, Y, X) :- X >= Y, !. max(X, Y, Y).</code> (Omits explicit check in second clause. If cut is removed, query <code>max(5, 2, 2)</code> incorrectly succeeds!).", styles['ans']))

    story.append(Spacer(1, 10))

    # --------------------------------------------------------------------------
    # PART 4: DIFFERENTIAL & INTEGRAL CALCULUS (SMA 2114)
    # --------------------------------------------------------------------------
    story.append(Paragraph("PART 4: SMA 2114 — DIFFERENTIAL & INTEGRAL CALCULUS (SOLVED EXAMS)", styles['h1']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1D4ED8"), spaceAfter=10))

    story.append(Paragraph("<b>Examination: UoN SMA 2114 / SCS 3114 Calculus — 2025 Semester Exam</b>", styles['h2']))
    story.append(Paragraph("<b>Question 1 (a) [6 Marks]:</b> Evaluate the integral: ∫ x² · e^(3x) dx using the technique of <b>Integration by Parts</b>.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "Formula: ∫ u dv = u v - ∫ v du.<br/>"
                           "<b>First Application:</b><br/>"
                           "Let u = x² → du = 2x dx. Let dv = e^(3x) dx → v = (1/3) e^(3x).<br/>"
                           "∫ x² e^(3x) dx = (1/3) x² e^(3x) - ∫ (2/3) x e^(3x) dx.<br/>"
                           "<b>Second Application on ∫ x e^(3x) dx:</b><br/>"
                           "Let u = x → du = dx. Let dv = e^(3x) dx → v = (1/3) e^(3x).<br/>"
                           "∫ x e^(3x) dx = (1/3) x e^(3x) - (1/3) ∫ e^(3x) dx = (1/3) x e^(3x) - (1/9) e^(3x).<br/>"
                           "<b>Substitute Back:</b><br/>"
                           "= (1/3) x² e^(3x) - (2/3) [ (1/3) x e^(3x) - (1/9) e^(3x) ] + C<br/>"
                           "= <b>(1/3) x² e^(3x) - (2/9) x e^(3x) + (2/27) e^(3x) + C</b> = <b>(e^(3x) / 27) [ 9x² - 6x + 2 ] + C</b>.", styles['ans']))

    story.append(Paragraph("<b>Question 2 (b) [8 Marks]:</b> Solve the first-order linear differential equation: dy/dx + (2/x) y = 4x, with initial condition y(1) = 2.", styles['q']))
    story.append(Paragraph("<b>Model Marking Scheme Solution:</b><br/>"
                           "Standard form: dy/dx + P(x) y = Q(x), where P(x) = 2/x, Q(x) = 4x.<br/>"
                           "<b>1. Integrating Factor I(x):</b><br/>"
                           "I(x) = e^(∫ P(x) dx) = e^(∫ (2/x) dx) = e^(2 ln|x|) = e^(ln(x²)) = <b>x²</b>.<br/>"
                           "<b>2. Multiply Differential Equation by I(x):</b><br/>"
                           "x² (dy/dx) + 2x y = 4x³ → d/dx [ x² y ] = 4x³.<br/>"
                           "<b>3. Integrate Both Sides:</b><br/>"
                           "x² y = ∫ 4x³ dx = x⁴ + C → <b>y(x) = x² + C / x²</b>.<br/>"
                           "<b>4. Apply Initial Condition y(1) = 2:</b><br/>"
                           "2 = 1² + C / 1² → 2 = 1 + C → <b>C = 1</b>.<br/>"
                           "<b>Particular Solution:</b> <b>y(x) = x² + 1/x²</b>.", styles['ans']))

    compile_pdf("UoN_Chiromo_Year2_Master_Past_Exams_Solved_Compendium_2018_2026.pdf", story)

# ==============================================================================
# 2. HIGH-YIELD FORMULA & CRAM SHEET HANDBOOK (ALL 7 UNITS)
# ==============================================================================
def build_high_yield_cram_handbook():
    styles = get_study_styles()
    story = []
    add_cover(
        story, styles,
        "UoN Chiromo Year 2: High-Yield Formula & Exam Cram Sheet Handbook",
        "Condensed Revision Sheets, Algorithm Tracing Guides, Core Theorems, and Examiner Trap Warnings for All 7 Year 2 Units",
        "• SCS 3201: Systems Analysis & Design<br/>• SCS 3203: Computer Architecture<br/>• SCS 3205: Knowledge-Based Systems<br/>• SCS 3207: Operating Systems<br/>• SCS 3209: Software Engineering<br/>• CSC 3211: Computer Networks<br/>• SMA 2114: Differential & Integral Calculus"
    )

    # Unit 1
    story.append(Paragraph("UNIT 1: SCS 3201 — SYSTEMS ANALYSIS AND DESIGN (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. DFD Rules (Kendall & Kendall Ch. 7):</b><br/>"
                           "• <b>Black Hole Trap:</b> Process has inputs but zero outputs (Data enters and disappears).<br/>"
                           "• <b>Miracle Trap:</b> Process produces outputs with zero inputs.<br/>"
                           "• <b>Gray Hole Trap:</b> Inputs are insufficient to produce the asserted outputs.<br/>"
                           "• <b>Direct Flow Prohibitions:</b> Data cannot flow directly between External Entity ↔ External Entity, nor Data Store ↔ Data Store, nor External Entity ↔ Data Store. Every flow MUST pass through a Process.", styles['body']))
    story.append(Paragraph("<b>2. TELOS Feasibility:</b> T = Technical, E = Economic (ROI, Payback), L = Legal, O = Operational, S = Schedule.", styles['body']))
    story.append(Paragraph("<b>3. Normalization Rules (1NF, 2NF, 3NF):</b><br/>"
                           "• <b>1NF:</b> Atomic values only; no repeating groups.<br/>"
                           "• <b>2NF:</b> In 1NF + No partial dependencies (all non-key attributes fully functionally dependent on whole composite primary key).<br/>"
                           "• <b>3NF:</b> In 2NF + No transitive dependencies (no non-key attribute depends on another non-key attribute: A → B and B → C).", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 2
    story.append(Paragraph("UNIT 2: SCS 3203 — COMPUTER ARCHITECTURE (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. IEEE-754 32-bit Single Precision Format:</b><br/>"
                           "• 1 Sign bit (s) | 8 Exponent bits (E) with Bias = 127 | 23 Fraction/Mantissa bits (F)<br/>"
                           "• Value = (-1)^s · (1.F) · 2^(E - 127). Special cases: E=255, F=0 → ±∞; E=255, F≠0 → NaN.", styles['body']))
    story.append(Paragraph("<b>2. Cache Address Calculation (Memory = 2^m bytes, Cache = 2^C bytes, Block = 2^b bytes):</b><br/>"
                           "• Word Offset = b bits.<br/>"
                           "• Direct Mapped: Number of lines N = 2^(C-b). Line Index = C-b bits. Tag = m - C bits.<br/>"
                           "• k-way Set Associative: Sets S = N / k = 2^(C-b) / k. Set Index = log2(S) bits. Tag = m - log2(S) - b bits.", styles['body']))
    story.append(Paragraph("<b>3. Pipelining Hazards:</b><br/>"
                           "• <b>Structural:</b> Hardware resource conflict (e.g., single memory port for Instruction and Data).<br/>"
                           "• <b>Data:</b> RAW (Read After Write - true dependency), WAR (anti), WAW (output). Solution: Forwarding/Bypassing or stalls.<br/>"
                           "• <b>Control:</b> Branch penalty. Solution: Dynamic branch prediction (2-bit saturating counter).", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 3
    story.append(Paragraph("UNIT 3: SCS 3207 — OPERATING SYSTEMS (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. CPU Scheduling Metrics:</b><br/>"
                           "• Turnaround Time = Completion Time - Arrival Time.<br/>"
                           "• Waiting Time = Turnaround Time - Burst Time.<br/>"
                           "• Response Time = Time from arrival to first CPU allocation.", styles['body']))
    story.append(Paragraph("<b>2. 4 Coffman Deadlock Conditions (ALL 4 must hold simultaneously):</b><br/>"
                           "1. Mutual Exclusion (non-shareable resources).<br/>"
                           "2. Hold and Wait (processes holding resources request new ones).<br/>"
                           "3. No Preemption (resources cannot be forcibly taken).<br/>"
                           "4. Circular Wait (P0 waiting for P1, P1 for P2... Pn for P0).", styles['body']))
    story.append(Paragraph("<b>3. Page Replacement Algorithms:</b><br/>"
                           "• <b>FIFO:</b> Suffers from Belady's Anomaly (increasing frames can increase page faults!).<br/>"
                           "• <b>LRU:</b> Replaces page unreferenced for longest time. Stack algorithm (immune to Belady's Anomaly).<br/>"
                           "• <b>Optimal (OPT/MIN):</b> Replaces page not needed for longest future time (theoretical benchmark).", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 4
    story.append(Paragraph("UNIT 4: CSC 3211 — COMPUTER NETWORKS (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. Subnetting & CIDR Calculation Cheat Formulas:</b><br/>"
                           "• Subnet Mask /N means N network/subnet bits and (32 - N) host bits.<br/>"
                           "• Total addresses per subnet = 2^(32 - N).<br/>"
                           "• Usable hosts per subnet = 2^(32 - N) - 2 (subtract Network Address and Broadcast Address).<br/>"
                           "• Block Size = 256 - Octet Value (e.g., /26 is 255.255.255.192 → Block size = 256 - 192 = 64).", styles['body']))
    story.append(Paragraph("<b>2. OSI 7 Layers vs. TCP/IP 4 Layers:</b><br/>"
                           "• 7: Application | 6: Presentation | 5: Session → <b>TCP/IP Application Layer</b> (HTTP, DNS, SSH)<br/>"
                           "• 4: Transport (TCP, UDP) → Segments (TCP provides reliable byte-stream, 3-way handshake SYN, SYN-ACK, ACK)<br/>"
                           "• 3: Network (IP, ICMP, OSPF, BGP) → Packets (logical addressing, routing)<br/>"
                           "• 2: Data Link (Ethernet, Wi-Fi, MAC) → Frames (physical addressing, framing, CRC error detection)<br/>"
                           "• 1: Physical (Bits, Voltage, Fiber) → Bits", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 5
    story.append(Paragraph("UNIT 5: SCS 3205 — KNOWLEDGE-BASED SYSTEMS (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. Expert System Architecture:</b> User Interface ↔ Inference Engine (Forward/Backward Chaining) ↔ Knowledge Base (Production Rules: IF condition THEN action) + Working Memory (Current facts).", styles['body']))
    story.append(Paragraph("<b>2. Inference Mechanisms:</b><br/>"
                           "• <b>Forward Chaining (Data-Driven):</b> Starts with known facts in working memory; applies rules to derive new facts until goal reached (used in monitoring, diagnosis, synthesis).<br/>"
                           "• <b>Backward Chaining (Goal-Driven):</b> Starts with hypothesized goal; searches rules that conclude the goal; recurses on preconditions (used in verification, diagnostic query systems, Prolog).", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 6
    story.append(Paragraph("UNIT 6: SCS 3209 — SOFTWARE ENGINEERING (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. Testing Levels & V-Model:</b><br/>"
                           "• Unit Testing (Functions/Classes) ↔ Detailed Design (LLD)<br/>"
                           "• Integration Testing (APIs/Databases) ↔ Architecture (SAD/HLD)<br/>"
                           "• System Testing (End-to-End Requirements) ↔ System Requirements (SRS)<br/>"
                           "• Acceptance Testing (UAT) ↔ User Requirements (URD/BRD)", styles['body']))
    story.append(Paragraph("<b>2. Clean Architecture & GoF Patterns:</b><br/>"
                           "• <b>SOLID Principles:</b> Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.<br/>"
                           "• <b>Repository Pattern:</b> Isolates business logic from database schema details.", styles['body']))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # Unit 7
    story.append(Paragraph("UNIT 7: SMA 2114 — DIFFERENTIAL & INTEGRAL CALCULUS (CRAM SHEET)", styles['h1']))
    story.append(Paragraph("<b>1. Essential Integration Formulas:</b><br/>"
                           "• ∫ 1 / (a² + x²) dx = (1/a) arctan(x/a) + C<br/>"
                           "• ∫ 1 / √(a² - x²) dx = arcsin(x/a) + C<br/>"
                           "• ∫ tan(x) dx = ln|sec(x)| + C | ∫ sec(x) dx = ln|sec(x) + tan(x)| + C", styles['body']))
    story.append(Paragraph("<b>2. Trigonometric Substitutions:</b><br/>"
                           "• √(a² - x²) → Let x = a sin(θ), dx = a cos(θ) dθ<br/>"
                           "• √(a² + x²) → Let x = a tan(θ), dx = a sec²(θ) dθ<br/>"
                           "• √(x² - a²) → Let x = a sec(θ), dx = a sec(θ) tan(θ) dθ", styles['body']))

    compile_pdf("UoN_Chiromo_Year2_High_Yield_Cram_Sheet_Handbook_All_7_Units.pdf", story)

if __name__ == "__main__":
    print("Building Offline Revision Compendiums...")
    build_master_exams_compendium()
    build_high_yield_cram_handbook()
    print("ALL OFFLINE STUDY ASSETS GENERATED SUCCESSFULLY!")
