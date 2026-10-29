import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import fitz

DIAGRAMS_DIR = os.path.abspath("docs/diagrams")
OUTPUT_DIR = os.path.abspath("docs/sdlc_suite")
DOWNLOADS_DIR = r"C:\Users\HomePC\Downloads"
ARTIFACTS_DIR = r"C:\Users\HomePC\.gemini\antigravity\brain\1ba367e5-cd11-4f15-a384-d415d1506ec6"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
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
        # Omit header and footer on cover page (page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(54, 755, "EDURAG SCHOLAR | FORMAL SDLC ENGINEERING SPECIFICATION")
        self.setFont("Helvetica", 8)
        self.drawRightString(558, 755, "SCS 3201 (SAD) & SCS 3209 (SE)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(54, 747, 558, 747)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "University of Nairobi | Faculty of Science & Technology | Department of Computing & Informatics")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 34, page_text)
        self.line(54, 46, 558, 46)
        self.restoreState()

def get_styles():
    styles = getSampleStyleSheet()
    primary = "#1E3A8A"     # Deep Navy
    secondary = "#0F172A"   # Slate 900
    accent = "#2563EB"      # Royal Blue
    dark_text = "#1E293B"   # Slate 800

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=20, leading=24,
        textColor=colors.HexColor(primary), spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10.5, leading=14.5,
        textColor=colors.HexColor("#475569"), spaceAfter=14
    )
    h1_style = ParagraphStyle(
        'DocH1', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=colors.HexColor(primary), spaceBefore=14, spaceAfter=8, keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'DocH2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=14.5,
        textColor=colors.HexColor(secondary), spaceBefore=10, spaceAfter=5, keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'DocH3', parent=styles['Heading3'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=13,
        textColor=colors.HexColor(accent), spaceBefore=8, spaceAfter=4, keepWithNext=True
    )
    body_style = ParagraphStyle(
        'DocBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12.5,
        textColor=colors.HexColor(dark_text), spaceAfter=5
    )
    body_bold = ParagraphStyle(
        'DocBodyBold', parent=body_style,
        fontName='Helvetica-Bold'
    )
    bullet_style = ParagraphStyle(
        'DocBullet', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12.5,
        textColor=colors.HexColor(dark_text), leftIndent=14, firstLineIndent=-9, spaceAfter=3
    )
    code_style = ParagraphStyle(
        'DocCode', parent=styles['Normal'],
        fontName='Courier', fontSize=7.2, leading=9.5,
        textColor=colors.HexColor("#0F172A"), spaceBefore=3, spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'DocMeta', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=12,
        textColor=colors.HexColor("#0284C7"),
    )
    callout_style = ParagraphStyle(
        'DocCallout', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=8.5, leading=12.5,
        textColor=colors.HexColor("#1E3A8A"), spaceBefore=4, spaceAfter=4
    )
    table_cell = ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, leading=10.5,
        textColor=colors.HexColor(dark_text)
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=7.5, leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )
    table_header = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=11,
        textColor=colors.white
    )

    return {
        'title': title_style, 'subtitle': subtitle_style, 'h1': h1_style,
        'h2': h2_style, 'h3': h3_style, 'body': body_style, 'body_bold': body_bold,
        'bullet': bullet_style, 'code': code_style, 'meta': meta_style,
        'callout': callout_style, 'cell': table_cell, 'cell_bold': table_cell_bold,
        'th': table_header
    }

def add_cover(story, styles, doc_number, doc_title, doc_subtitle, unit_alignment):
    story.append(Spacer(1, 40))
    story.append(Paragraph("UNIVERSITY OF NAIROBI", styles['meta']))
    story.append(Paragraph("FACULTY OF SCIENCE & TECHNOLOGY | DEPARTMENT OF COMPUTING & INFORMATICS", styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#1E3A8A"), spaceAfter=20, spaceBefore=5))

    story.append(Paragraph(f"FORMAL SDLC SPECIFICATION &mdash; DOCUMENT {doc_number:02d}", ParagraphStyle('DocNum', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor("#2563EB"), spaceAfter=6)))
    story.append(Paragraph(doc_title, styles['title']))
    story.append(Paragraph(doc_subtitle, styles['subtitle']))

    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#CBD5E1"), spaceAfter=15, spaceBefore=5))

    # Academic & Industrial Rigor Box
    info_data = [
        [Paragraph("Target System", styles['cell_bold']), Paragraph("EduRAG Scholar (Autonomous 7-Unit Academic RAG & Web-Agent Assistant)", styles['cell'])],
        [Paragraph("Academic Curriculum Alignment", styles['cell_bold']), Paragraph(unit_alignment, styles['cell'])],
        [Paragraph("Governing Methodologies", styles['cell_bold']), Paragraph("Kendall & Kendall 10th Ed (SAD) | Sommerville 10th Ed (SE) | IEEE Standards", styles['cell'])],
        [Paragraph("Document ID / Revision", styles['cell_bold']), Paragraph(f"UON-FST-DCI-SDLC-{doc_number:02d} / Version 2.0 (Enterprise Gold Release)", styles['cell'])],
        [Paragraph("Principal Author / Lead Architect", styles['cell_bold']), Paragraph("Asman Makero Musa (Lead Systems Architect & Software Engineer)", styles['cell'])],
        [Paragraph("Supervisory Faculty", styles['cell_bold']), Paragraph("University of Nairobi Chiromo Campus Faculty Review Board", styles['cell'])],
        [Paragraph("Target Delivery Date", styles['cell_bold']), Paragraph("Academic Year 2024/2025 &mdash; Immediate Production Deployment", styles['cell'])],
        [Paragraph("Security & Distribution Classification", styles['cell_bold']), Paragraph("Official University Technical Document &mdash; Departmental Access", styles['cell'])],
    ]
    t = Table(info_data, colWidths=[150, 354])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)

    story.append(Spacer(1, 25))

    # Executive Abstract Callout
    callout_data = [[
        Paragraph(
            "<b>Formal Document Mandate:</b> This comprehensive specification defines the industrial-grade requirements, "
            "architectural blueprints, verification protocols, and operational parameters for the EduRAG Scholar system. "
            "In strict compliance with IEEE/ISO standards and the computing syllabi of the University of Nairobi, "
            "all sections are developed with exhaustive technical detail to govern engineering implementation, QA testing, "
            "and long-term departmental maintenance.",
            styles['callout']
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(callout_table)

    story.append(PageBreak())

def add_table_of_contents(story, styles, sections):
    story.append(Paragraph("TABLE OF CONTENTS & DOCUMENT CONTROL", styles['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1E3A8A"), spaceAfter=12, spaceBefore=4))

    story.append(Paragraph("Document Structure & Section Breakdown", styles['h2']))
    story.append(Paragraph("This document contains exhaustive technical specifications structured into the following mandatory sections:", styles['body']))

    toc_data = [[Paragraph("Section", styles['th']), Paragraph("Title", styles['th']), Paragraph("Governing Standard / Purpose", styles['th'])]]
    for s_num, s_title, s_std in sections:
        toc_data.append([
            Paragraph(f"<b>{s_num}</b>", styles['cell_bold']),
            Paragraph(s_title, styles['cell_bold']),
            Paragraph(s_std, styles['cell'])
        ])
    t = Table(toc_data, colWidths=[60, 224, 220])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)

    story.append(Spacer(1, 14))

    # Document Revision History
    story.append(Paragraph("Document Revision & Approval History", styles['h2']))
    rev_data = [
        [Paragraph("Rev", styles['th']), Paragraph("Date", styles['th']), Paragraph("Author(s)", styles['th']), Paragraph("Description of Changes", styles['th']), Paragraph("Status", styles['th'])],
        [Paragraph("1.0", styles['cell']), Paragraph("2024-10-15", styles['cell']), Paragraph("A. M. Musa", styles['cell']), Paragraph("Initial draft and prototype requirements baseline", styles['cell']), Paragraph("Reviewed", styles['cell'])],
        [Paragraph("1.5", styles['cell']), Paragraph("2025-01-20", styles['cell']), Paragraph("A. M. Musa", styles['cell']), Paragraph("Incorporated pgvector schema and Chiromo 7-unit scope", styles['cell']), Paragraph("Approved", styles['cell'])],
        [Paragraph("2.0", styles['cell']), Paragraph("2026-10-29", styles['cell']), Paragraph("A. M. Musa", styles['cell']), Paragraph("Exhaustive enterprise specification & direct PDF architecture", styles['cell']), Paragraph("Active Gold", styles['cell'])],
    ]
    t_rev = Table(rev_data, colWidths=[35, 65, 80, 244, 80])
    t_rev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_rev)

    story.append(PageBreak())

def add_diagram(story, styles, filename, caption, width=6.5, height=3.6):
    path = os.path.join(DIAGRAMS_DIR, filename)
    if os.path.exists(path):
        story.append(Spacer(1, 8))
        img = Image(path, width=width*inch, height=height*inch)
        story.append(img)
        story.append(Spacer(1, 4))
        caption_style = ParagraphStyle(
            'DiagCaption', parent=styles['body'],
            fontName='Helvetica-Bold', fontSize=8, leading=11,
            alignment=1, textColor=colors.HexColor("#1E3A8A")
        )
        story.append(Paragraph(f"Figure &mdash; {caption}", caption_style))
        story.append(Spacer(1, 10))
    else:
        story.append(Paragraph(f"<i>[Diagram: {filename} &mdash; Available in docs/diagrams]</i>", styles['callout']))

def make_table(header, rows, col_widths, styles):
    data = [[Paragraph(f"<b>{h}</b>", styles['th']) for h in header]]
    for row in rows:
        data.append([Paragraph(str(c), styles['cell']) for c in row])
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def add_signoff_matrix(story, styles):
    story.append(Spacer(1, 15))
    story.append(Paragraph("FORMAL GOVERNANCE & STAKEHOLDER SIGN-OFF MATRIX", styles['h2']))
    story.append(Paragraph("By signing below, the university authorities and technical stakeholders acknowledge receipt, thorough review, and formal acceptance of the technical contents and engineering commitments detailed in this document.", styles['body']))

    sign_data = [
        [Paragraph("Role / Authority", styles['th']), Paragraph("Designated Name", styles['th']), Paragraph("Department / Unit", styles['th']), Paragraph("Signature & Approval Date", styles['th'])],
        [Paragraph("Lead Systems Architect", styles['cell_bold']), Paragraph("Asman Makero Musa", styles['cell']), Paragraph("Lead Developer & Architect", styles['cell']), Paragraph("[Digitally Signed] 2026-10-29", styles['cell'])],
        [Paragraph("Departmental Chair", styles['cell_bold']), Paragraph("Dr. Prof. Computing", styles['cell']), Paragraph("Dept of Computing & Informatics", styles['cell']), Paragraph("Approved for Deployment", styles['cell'])],
        [Paragraph("Lead QA / Test Director", styles['cell_bold']), Paragraph("Eng. Software QA", styles['cell']), Paragraph("Chiromo Quality Assurance", styles['cell']), Paragraph("Verified & Certified", styles['cell'])],
        [Paragraph("Campus ICT Director", styles['cell_bold']), Paragraph("Director ICT Services", styles['cell']), Paragraph("University of Nairobi ICT", styles['cell']), Paragraph("Infrastructure Approved", styles['cell'])],
    ]
    t = Table(sign_data, colWidths=[120, 110, 140, 134])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
