import os
import json
import logging
from io import BytesIO
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

logger = logging.getLogger("edurag.qa_pdf")


class NumberedQACanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedQACanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedQACanvas, self).showPage()
        super(NumberedQACanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))

        if self._pageNumber > 1:
            self.drawString(54, 755, "EDURAG SCHOLAR • REVISION COMPANION & MODEL SOLUTION COMPENDIUM")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 748, 558, 748)

        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)

        self.setFont("Helvetica", 7.5)
        self.drawString(54, 32, "Autonomous Question-Answer Synthesizer • Prescribed Syllabus Grounding")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()


def build_revision_qa_pdf(qa_data: Dict[str, Any]) -> bytes:
    """
    Builds a beautifully structured revision question & verified answer compendium (PDF).
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

    navy_dark = colors.HexColor("#0B132B")
    uon_blue = colors.HexColor("#1E3A8A")
    brand_blue = colors.HexColor("#2563EB")
    emerald_green = colors.HexColor("#047857")
    slate_subtle = colors.HexColor("#475569")
    bg_box = colors.HexColor("#F8FAFC")
    bg_q = colors.HexColor("#EFF6FF")   # Soft blue for question
    bg_ans = colors.HexColor("#F0FDF4") # Soft green for answer
    bg_pitfall = colors.HexColor("#FFFBEB") # Soft amber for exam traps

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=navy_dark,
        spaceAfter=4
    )

    unit_subtitle_style = ParagraphStyle(
        'UnitSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=brand_blue,
        spaceAfter=12
    )

    q_box_style = ParagraphStyle(
        'QBoxText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1E3A8A")
    )

    h2_style = ParagraphStyle(
        'H2Answer',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=emerald_green,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'AnswerBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )

    pitfall_style = ParagraphStyle(
        'PitfallText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400E")
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=slate_subtle
    )

    story = []

    unit_code = qa_data.get("unit_code", "SCS 3201")
    unit_name = qa_data.get("unit_name", "Academic Unit")
    topic = qa_data.get("topic", "General Curriculum Topic")
    question_text = qa_data.get("question", "")
    model_answer = qa_data.get("model_answer", "")
    citations = qa_data.get("citations", [])
    pitfalls = qa_data.get("common_pitfalls", "")
    marking_rubric = qa_data.get("marking_rubric", [])

    # Header
    story.append(Paragraph("EDURAG SCHOLAR • REVISION INTELLIGENCE COMPENDIUM", ParagraphStyle('PreH', fontName='Helvetica-Bold', fontSize=8.5, textColor=brand_blue, spaceAfter=4)))
    story.append(Paragraph(f"Autonomous Revision Q&A Companion: {topic}", title_style))
    story.append(Paragraph(f"Unit Focus: <b>{unit_code} — {unit_name}</b> • University of Nairobi", unit_subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand_blue, spaceAfter=10))

    # Question Card
    q_content = [
        Paragraph("<b>QUESTION FED / REVISION PROBLEM:</b>", ParagraphStyle('QLabel', fontName='Helvetica-Bold', fontSize=8, textColor=brand_blue, spaceAfter=3)),
        Paragraph(question_text.replace("\n", "<br/>"), q_box_style)
    ]
    t_q = Table([[q_content]], colWidths=[504])
    t_q.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_q),
        ('LINELEFT', (0,0), (-1,-1), 3.5, brand_blue),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_q)
    story.append(Spacer(1, 10))

    # Model Answer Section
    story.append(Paragraph("Comprehensive Model Answer (Syllabus-Aligned):", h2_style))
    
    # Clean and split model answer into paragraphs
    for p in model_answer.split("\n\n"):
        clean_p = p.strip()
        if clean_p:
            clean_p = clean_p.replace("\n", "<br/>")
            # Highlight bold and points
            story.append(Paragraph(clean_p, body_style))

    story.append(Spacer(1, 8))

    # Marking Scheme / Rubric breakdown if present
    if marking_rubric:
        story.append(Paragraph("Marking Scheme & Point Allocation Breakdown:", ParagraphStyle('RubricH', fontName='Helvetica-Bold', fontSize=9.5, textColor=navy_dark, spaceAfter=4)))
        rubric_rows = [["Awardable Marks", "Demonstrated Concept / Proof Requirement"]]
        for r in marking_rubric:
            rubric_rows.append([str(r.get("marks", "2M")), str(r.get("criterion", ""))])
        
        t_rubric = Table(rubric_rows, colWidths=[90, 414])
        t_rubric.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_rubric)
        story.append(Spacer(1, 10))

    # Common Lecturer Traps / Pitfalls Box
    if pitfalls:
        p_content = [
            Paragraph("⚠️ <b>LECTURER EXAM TRAPS & FREQUENT STUDENT PITFALLS:</b>", ParagraphStyle('PitfallH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#B45309"), spaceAfter=3)),
            Paragraph(pitfalls.replace("\n", "<br/>"), pitfall_style)
        ]
        t_p = Table([[p_content]], colWidths=[504])
        t_p.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_pitfall),
            ('LINELEFT', (0,0), (-1,-1), 3.5, colors.HexColor("#D97706")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#FDE68A")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t_p)
        story.append(Spacer(1, 10))

    # Grounding Citations
    if citations:
        story.append(Paragraph("Grounding Citations & Lecture References:", ParagraphStyle('CiteH', fontName='Helvetica-Bold', fontSize=8.5, textColor=slate_subtle, spaceAfter=3)))
        for c in citations:
            doc_title = c.get("document_title", "Prescribed Syllabus")
            page_no = c.get("page_number", 1)
            story.append(Paragraph(f"• <b>{doc_title}</b> (Page / Slide {page_no})", ParagraphStyle('CiteItem', fontName='Helvetica', fontSize=8, textColor=colors.HexColor("#0284C7"), leftIndent=10, spaceAfter=2)))

    doc.build(story, canvasmaker=NumberedQACanvas)
    return buffer.getvalue()
