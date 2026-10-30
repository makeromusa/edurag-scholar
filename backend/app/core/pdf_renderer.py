import os
import sys
import logging
from io import BytesIO
from typing import Dict, Any, List
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger("edurag.pdf_renderer")

# Setup Jinja2 Environment pointing to templates directory
TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

def render_html_template(template_name: str, context: Dict[str, Any]) -> str:
    """Renders a Jinja2 HTML template with context dictionary."""
    template = jinja_env.get_template(template_name)
    return template.render(**context)

def convert_html_to_pdf(html_content: str, fallback_type: str = "answer_sheet", context: Dict[str, Any] = None) -> bytes:
    """
    Renders HTML string to PDF bytes using WeasyPrint.
    If WeasyPrint native C-libraries (Pango/Cairo/GObject) are not installed on the host OS,
    it gracefully falls back to ReportLab to ensure zero-downtime execution.
    """
    try:
        from weasyprint import HTML
        logger.info("Rendering PDF via WeasyPrint...")
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except (ImportError, OSError) as e:
        logger.warning(f"WeasyPrint native library unavailable on this host ({e}). Utilizing high-res fallback PDF builder...")
        if fallback_type == "answer_sheet":
            return _render_answer_sheet_reportlab(context or {})
        else:
            return _render_simulated_exam_reportlab(context or {})

def _render_answer_sheet_reportlab(context: Dict[str, Any]) -> bytes:
    """ReportLab fallback renderer adhering to the exact required design specs."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.pdfgen import canvas

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('TStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor("#0F172A"), alignment=1, spaceAfter=4)
    sub_style = ParagraphStyle('SStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=colors.HexColor("#475569"), alignment=1, spaceAfter=12)
    q_text_style = ParagraphStyle('QText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=13.5, textColor=colors.white)
    a_text_style = ParagraphStyle('AText', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13.5, textColor=colors.HexColor("#1E293B"))
    a_label_style = ParagraphStyle('ALabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#059669"), spaceAfter=4)

    story = [
        Paragraph(context.get("title", "University Revision Paper • Detailed Model Solutions"), title_style),
        Paragraph(f"Unit: <b>{context.get('unit_code', 'ACADEMIC')}</b> • Grounded in Prescribed Class Notes & Textbooks", sub_style),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=14)
    ]

    for idx, item in enumerate(context.get("qa_items", []), 1):
        # Requirement: Question card with dark blue background and white text
        q_p = Paragraph(f"<b>QUESTION {idx}:</b> {item.get('question', '')}", q_text_style)
        t_q = Table([[q_p]], colWidths=[504])
        t_q.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0F172A")),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t_q)

        # Requirement: Answer card with light grey background and green left-border
        ans_paras = [Paragraph("COMPREHENSIVE MODEL ANSWER & WORKING:", a_label_style)]
        for para in item.get("detailed_answer", "").split("\n\n"):
            if para.strip():
                ans_paras.append(Paragraph(para.strip().replace("\n", "<br/>"), a_text_style))
                ans_paras.append(Spacer(1, 4))
        
        t_a = Table([[ans_paras]], colWidths=[504])
        t_a.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
            ('LINELEFT', (0,0), (-1,-1), 4, colors.HexColor("#10B981")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(t_a)
        story.append(Spacer(1, 14))

    doc.build(story)
    return buffer.getvalue()

def _render_simulated_exam_reportlab(context: Dict[str, Any]) -> bytes:
    from app.core.exam_pdf_builder import build_simulated_exam_pdf
    return build_simulated_exam_pdf(context, include_answers=False)
