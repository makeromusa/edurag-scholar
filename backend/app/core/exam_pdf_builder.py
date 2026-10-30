import os
import json
import logging
from io import BytesIO
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

logger = logging.getLogger("edurag.exam_pdf")


class NumberedExamCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedExamCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedExamCanvas, self).showPage()
        super(NumberedExamCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))

        # Top Running Header (From Page 2)
        if self._pageNumber > 1:
            self.drawString(54, 755, "UNIVERSITY OF NAIROBI • FACULTY OF SCIENCE & TECHNOLOGY • EXAM SIMULATION")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 748, 558, 748)

        # Bottom Running Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)

        self.setFont("Helvetica", 7.5)
        self.drawString(54, 32, "EduRAG Autonomous Academic Copilot • Chiromo Examination Standards")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()


def build_simulated_exam_pdf(
    exam_data: Dict[str, Any],
    include_answers: bool = True
) -> bytes:
    """
    Generates a full, publication-quality, color-coded academic examination paper (PDF)
    with optional complete step-by-step marking schemes and model solutions.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Brand Palette
    navy_dark = colors.HexColor("#0B132B")
    uon_blue = colors.HexColor("#1E3A8A")
    accent_blue = colors.HexColor("#2563EB")
    emerald_green = colors.HexColor("#047857")
    slate_subtle = colors.HexColor("#475569")
    bg_box = colors.HexColor("#F8FAFC")
    bg_ans = colors.HexColor("#F0FDF4")   # Soft green tint for answers

    uon_title_style = ParagraphStyle(
        'UoNHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=navy_dark,
        alignment=1, # Center
        spaceAfter=3
    )

    uon_sub_style = ParagraphStyle(
        'UoNSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=slate_subtle,
        alignment=1,
        spaceAfter=2
    )

    exam_code_style = ParagraphStyle(
        'ExamCode',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=accent_blue,
        alignment=1,
        spaceAfter=12
    )

    q_title_style = ParagraphStyle(
        'QuestionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=navy_dark,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'ExamBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )

    subpart_style = ParagraphStyle(
        'SubPart',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=15,
        spaceAfter=4
    )

    ans_header_style = ParagraphStyle(
        'AnsHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=emerald_green,
        spaceBefore=4,
        spaceAfter=3
    )

    ans_text_style = ParagraphStyle(
        'AnsText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#064E3B"),
        spaceAfter=4
    )

    citation_style = ParagraphStyle(
        'CitationText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0284C7"),
        spaceBefore=2
    )

    story = []

    unit_code = exam_data.get("unit_code", "SCS 3201")
    unit_name = exam_data.get("unit_name", "Computer Science Examination")
    academic_year = exam_data.get("academic_year", "2025/2026")
    semester = exam_data.get("semester", "FIRST SEMESTER")
    time_allowed = exam_data.get("time_allowed", "2 HOURS")
    instructions = exam_data.get("instructions", "Answer Question ONE (Compulsory) and any other TWO questions.")

    # 1. Official Header
    story.append(Paragraph("UNIVERSITY OF NAIROBI", uon_title_style))
    story.append(Paragraph("FACULTY OF SCIENCE AND TECHNOLOGY • DEPARTMENT OF COMPUTING AND INFORMATICS", uon_sub_style))
    story.append(Paragraph(f"UNIVERSITY EXAMINATIONS {academic_year}", uon_sub_style))
    story.append(Paragraph(f"SECOND YEAR EXAMINATIONS FOR THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER SCIENCE", uon_sub_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>{unit_code}: {unit_name.upper()}</b>", exam_code_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=uon_blue, spaceAfter=8))

    # Meta Table: Date, Time, Instructions
    meta_data = [
        [
            Paragraph(f"<b>DATE:</b> {exam_data.get('exam_date', 'OCTOBER 2026')}", body_style),
            Paragraph(f"<b>TIME ALLOWED:</b> {time_allowed}", body_style)
        ],
        [
            Paragraph(f"<b>TOTAL MARKS:</b> 70 MARKS", body_style),
            Paragraph(f"<b>EXAM TYPE:</b> Autonomous Chiromo Standard Simulation", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_box),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # Instructions Box
    inst_p = Paragraph(f"<b>INSTRUCTIONS:</b> {instructions}", ParagraphStyle('InstP', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=navy_dark))
    t_inst = Table([[inst_p]], colWidths=[504])
    t_inst.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")), # Soft amber
        ('LINELEFT', (0,0), (-1,-1), 3, colors.HexColor("#D97706")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#FDE68A")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_inst)
    story.append(Spacer(1, 10))

    # 2. Iterate Questions
    questions = exam_data.get("questions", [])
    for q_idx, q in enumerate(questions, 1):
        q_num = q.get("question_number", f"QUESTION {q_idx}")
        compulsory = q.get("is_compulsory", False)
        marks = q.get("total_marks", 20)
        badge = "COMPULSORY" if compulsory else "ELECTIVE"
        
        q_title = f"{q_num.upper()} [{marks} MARKS] — {badge}"
        story.append(Paragraph(q_title, q_title_style))

        q_stem = q.get("stem", "")
        if q_stem:
            story.append(Paragraph(q_stem, body_style))

        sub_questions = q.get("sub_questions", [])
        for sub in sub_questions:
            label = sub.get("label", "a)")
            text = sub.get("text", "")
            sub_marks = sub.get("marks", 5)
            
            sub_rendered = f"<b>{label}</b> {text} <b>[{sub_marks} Marks]</b>"
            story.append(Paragraph(sub_rendered, subpart_style))

            # Include Answer Key if requested
            if include_answers and sub.get("model_answer"):
                ans_content = []
                ans_content.append(Paragraph(f"✔ <b>Model Solution & Marking Scheme [{sub_marks}M]:</b>", ans_header_style))
                
                # Render answer paragraphs
                clean_ans = sub.get("model_answer", "").replace("\n", "<br/>")
                ans_content.append(Paragraph(clean_ans, ans_text_style))
                
                citation = sub.get("citation", "")
                if citation:
                    ans_content.append(Paragraph(f"<i>Source Grounding: {citation}</i>", citation_style))

                t_ans = Table([[ans_content]], colWidths=[480])
                t_ans.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), bg_ans),
                    ('LINELEFT', (0,0), (-1,-1), 2.5, emerald_green),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#BBF7D0")),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                    ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ]))
                
                story.append(Spacer(1, 2))
                story.append(t_ans)
                story.append(Spacer(1, 4))

        story.append(Spacer(1, 8))
        if q_idx < len(questions):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

    # End of Exam Banner
    story.append(Spacer(1, 10))
    story.append(Paragraph("=== END OF EXAMINATION PAPER ===", ParagraphStyle('EndExam', fontName='Helvetica-Bold', fontSize=10, textColor=navy_dark, alignment=1)))

    doc.build(story, canvasmaker=NumberedExamCanvas)
    return buffer.getvalue()
