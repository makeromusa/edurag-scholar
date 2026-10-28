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

DIAGRAMS_DIR = os.path.abspath("docs/diagrams")
OUTPUT_DIR = os.path.abspath("docs/sdlc_suite")
DOWNLOADS_DIR = r"C:\Users\HomePC\Downloads"
ARTIFACTS_DIR = r"C:\Users\HomePC\.gemini\antigravity\brain\1ba367e5-cd11-4f15-a384-d415d1506ec6"

os.makedirs(OUTPUT_DIR, exist_ok=True)

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
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # skip cover
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 755, "EDURAG SCHOLAR | SCS 3201 (SAD) & SCS 3209 (SE) PRACTICAL SUITE")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(54, 747, 558, 747)

        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "University of Nairobi | Department of Computing & Informatics | Chiromo Campus")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 34, page_text)
        self.line(54, 46, 558, 46)
        self.restoreState()

def get_doc_styles():
    styles = getSampleStyleSheet()
    primary = "#1E3A8A"
    secondary = "#0F172A"
    accent = "#2563EB"

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor(primary),
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        spaceAfter=20
    )
    h1_style = ParagraphStyle(
        'DocH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor(primary),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor(secondary),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'DocH3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor(accent),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=4,
        spaceAfter=6
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0284C7"),
    )
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'h3': h3_style,
        'body': body_style,
        'bullet': bullet_style,
        'code': code_style,
        'meta': meta_style
    }

def create_cover(story, styles, doc_number, doc_title, doc_subtitle, unit_alignment):
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"UNIVERSITY OF NAIROBI — FACULTY OF SCIENCE & TECHNOLOGY", styles['meta']))
    story.append(Paragraph(f"DEPARTMENT OF COMPUTING & INFORMATICS | CHIROMO CAMPUS", styles['meta']))
    story.append(Spacer(1, 25))
    story.append(Paragraph(f"VOLUME {doc_number}: {doc_title.upper()}", styles['title']))
    story.append(Paragraph(doc_subtitle, styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#1E3A8A"), spaceAfter=20))

    meta_table_data = [
        [Paragraph("<b>Project:</b>", styles['body']), Paragraph("EduRAG Scholar (Academic Copilot & Professor Studio)", styles['body'])],
        [Paragraph("<b>Curriculum Alignment:</b>", styles['body']), Paragraph(f"<b>{unit_alignment}</b>", styles['body'])],
        [Paragraph("<b>Primary References:</b>", styles['body']), Paragraph("• Kendall & Kendall: <i>Systems Analysis and Design (10th ed.)</i><br/>• Ian Sommerville: <i>Software Engineering (9th/10th ed.)</i>", styles['body'])],
        [Paragraph("<b>Student / Author:</b>", styles['body']), Paragraph("Asman Makero Musa (Reg: P15/XXXXX/2024)", styles['body'])],
        [Paragraph("<b>Target Infrastructure:</b>", styles['body']), Paragraph("Azure App Service (Linux B1) | Supabase (PostgreSQL pgvector) | Google Gemini 2.5 Flash", styles['body'])],
        [Paragraph("<b>Document Status:</b>", styles['body']), Paragraph("<b>APPROVED & VERIFIED ENGINEERING SPECIFICATION</b>", styles['body'])],
        [Paragraph("<b>Release Date:</b>", styles['body']), Paragraph("Academic Year 2024/2025 (Semester II Final Review)", styles['body'])],
    ]
    t = Table(meta_table_data, colWidths=[1.8*inch, 5.2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(PageBreak())

def add_diagram(story, styles, img_filename, caption, width=6.8*inch, height=3.8*inch):
    path = os.path.join(DIAGRAMS_DIR, img_filename)
    if os.path.exists(path):
        story.append(Spacer(1, 10))
        img = Image(path, width=width, height=height)
        story.append(img)
        story.append(Spacer(1, 4))
        cap_p = Paragraph(f"<b>Figure:</b> <i>{caption}</i>", ParagraphStyle('Cap', parent=styles['body'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor("#475569"), alignment=1))
        story.append(cap_p)
        story.append(Spacer(1, 10))
    else:
        story.append(Paragraph(f"<i>[Diagram Placeholder: {img_filename}]</i>", styles['body']))

print("Setup completed. Building document generators...")
