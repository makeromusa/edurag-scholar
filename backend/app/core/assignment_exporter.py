import io
import re
import logging
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

logger = logging.getLogger("edurag.assignment_exporter")


class NumberedAssignmentCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedAssignmentCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedAssignmentCanvas, self).showPage()
        super(NumberedAssignmentCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 755, "ACADEMIC ASSIGNMENT SOLUTION & ARCHITECTURE REPORT")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(54, 748, 558, 748)

        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 45, 558, 45)

        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "Syllabus-Grounded Technical Derivation • Academic Intelligence")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()


def clean_markdown_for_pdf(text: str) -> str:
    """Prepares markdown text for clean ReportLab rendering."""
    # Convert bold **text** to <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Convert italic *text* to <i>text</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Strip backticks
    text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', text)
    # Escape standalone &
    text = text.replace('&', '&amp;')
    return text


def build_assignment_pdf(data: Dict[str, Any]) -> bytes:
    """
    Builds a clean, publication-grade academic assignment PDF.
    Anonymous by default: never includes student name unless explicitly supplied.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'AssignmentTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        'AssignmentMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#2563EB")
    )

    h1_style = ParagraphStyle(
        'AssignmentH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'AssignmentBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'AssignmentCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=6,
        spaceAfter=8
    )

    elements = []

    # Title & Metadata Banner
    unit_code = data.get("unit_code", "ACADEMIC COURSE")
    unit_name = data.get("unit_name", "")
    title = data.get("title", f"{unit_code} Assignment Solution")
    target_marks = data.get("target_marks")

    elements.append(Paragraph(f"{unit_code}: {unit_name}".strip(": "), meta_style))
    elements.append(Paragraph(title, title_style))

    sub_info = []
    if target_marks:
        sub_info.append(f"<b>Mark Allocation:</b> {target_marks} Marks")
    sub_info.append("<b>Evaluation:</b> Step-by-Step Technical Derivation")
    
    # Optional student name ONLY if explicitly asked
    if data.get("student_name"):
        sub_info.append(f"<b>Author:</b> {data['student_name']}")

    elements.append(Paragraph(" • ".join(sub_info), body_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceBefore=4, spaceAfter=14))

    # Original Prompt / Question Box
    question = data.get("question", "")
    if question:
        q_html = f"<b>ASSIGNMENT PROBLEM STATEMENT:</b><br/>{clean_markdown_for_pdf(question)}"
        q_table = Table([[Paragraph(q_html, body_style)]], colWidths=[504])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(q_table)
        elements.append(Spacer(1, 14))

    # Solution Content
    content = data.get("solution_markdown", "")
    lines = content.split("\n")
    in_code_block = False
    code_accumulator = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code_block:
                # Flush code block
                code_text = "<br/>".join([clean_markdown_for_pdf(c) for c in code_accumulator])
                elements.append(Paragraph(code_text, code_style))
                code_accumulator = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_accumulator.append(line)
            continue

        if not stripped:
            elements.append(Spacer(1, 4))
            continue

        if stripped.startswith("#"):
            heading_text = stripped.lstrip("#").strip()
            elements.append(Paragraph(clean_markdown_for_pdf(heading_text), h1_style))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            bullet_text = f"• {stripped[2:]}"
            elements.append(Paragraph(clean_markdown_for_pdf(bullet_text), body_style))
        else:
            elements.append(Paragraph(clean_markdown_for_pdf(stripped), body_style))

    if code_accumulator:
        code_text = "<br/>".join([clean_markdown_for_pdf(c) for c in code_accumulator])
        elements.append(Paragraph(code_text, code_style))

    doc.build(elements, canvasmaker=NumberedAssignmentCanvas)
    buffer.seek(0)
    return buffer.getvalue()


def build_assignment_docx(data: Dict[str, Any]) -> bytes:
    """
    Builds a clean, styled Microsoft Word (.docx) file.
    Anonymous by default: never includes student name unless explicitly supplied.
    """
    doc = docx.Document()

    # Page Margins: Standard 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    title_p = doc.add_paragraph()
    unit_code = data.get("unit_code", "ACADEMIC COURSE")
    unit_name = data.get("unit_name", "")
    title_text = data.get("title", f"{unit_code} Assignment Solution")

    meta_run = title_p.add_run(f"{unit_code}: {unit_name}\n")
    meta_run.font.name = 'Calibri'
    meta_run.font.size = Pt(11)
    meta_run.font.bold = True
    meta_run.font.color.rgb = RGBColor(37, 99, 235)

    title_run = title_p.add_run(title_text)
    title_run.font.name = 'Calibri'
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)

    # Sub-info
    sub_p = doc.add_paragraph()
    sub_parts = []
    if data.get("target_marks"):
        sub_parts.append(f"Mark Allocation: {data['target_marks']} Marks")
    sub_parts.append("Technical Derivation & Diagram Architecture")
    if data.get("student_name"):
        sub_parts.append(f"Author: {data['student_name']}")

    sub_run = sub_p.add_run(" • ".join(sub_parts))
    sub_run.font.size = Pt(9.5)
    sub_run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Question Box
    question = data.get("question", "")
    if question:
        q_table = doc.add_table(rows=1, cols=1)
        q_table.style = 'Light Shading'
        cell = q_table.cell(0, 0)
        cp = cell.paragraphs[0]
        header_run = cp.add_run("ASSIGNMENT PROBLEM STATEMENT:\n")
        header_run.bold = True
        header_run.font.size = Pt(9.5)
        body_run = cp.add_run(question)
        body_run.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Solution Content
    content = data.get("solution_markdown", "")
    lines = content.split("\n")
    in_code_block = False
    code_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code_block:
                cp = doc.add_paragraph()
                cp.paragraph_format.left_indent = Inches(0.25)
                c_run = cp.add_run("\n".join(code_lines))
                c_run.font.name = 'Consolas'
                c_run.font.size = Pt(9)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            continue

        if stripped.startswith("#"):
            heading_text = stripped.lstrip("#").strip()
            hp = doc.add_paragraph()
            h_run = hp.add_run(heading_text)
            h_run.font.name = 'Calibri'
            h_run.font.size = Pt(13)
            h_run.font.bold = True
            h_run.font.color.rgb = RGBColor(30, 41, 59)
            hp.paragraph_format.space_before = Pt(12)
            hp.paragraph_format.space_after = Pt(4)
        elif stripped.startswith("- ") or stripped.startswith("* "):
            bp = doc.add_paragraph(style='List Bullet')
            clean_text = stripped[2:].replace("**", "")
            b_run = bp.add_run(clean_text)
            b_run.font.size = Pt(10)
        else:
            p = doc.add_paragraph()
            # Handle bold tags simply
            parts = re.split(r'(\*\*.*?\*\*)', stripped)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p.add_run(part)
                r.font.name = 'Calibri'
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(51, 65, 85)

    if code_lines:
        cp = doc.add_paragraph()
        cp.paragraph_format.left_indent = Inches(0.25)
        c_run = cp.add_run("\n".join(code_lines))
        c_run.font.name = 'Consolas'
        c_run.font.size = Pt(9)

    out = io.BytesIO()
    doc.save(out)
    out.seek(0)
    return out.getvalue()
