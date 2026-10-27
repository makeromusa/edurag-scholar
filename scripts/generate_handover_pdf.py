import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages after page 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "EduRAG Scholar - Official Client Project Handover")
            self.drawRightString(612 - 54, 755, "Confidential & Proprietary")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 747, 612 - 54, 747)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 32, "EduRAG Scholar | University of Nairobi CS Copilot")
        self.drawRightString(612 - 54, 32, page_text)
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0f172a")     # Slate 900
    c_blue = colors.HexColor("#1d4ed8")        # Blue 700
    c_blue_light = colors.HexColor("#eff6ff")  # Blue 50
    c_slate_dark = colors.HexColor("#334155")  # Slate 700
    c_border = colors.HexColor("#e2e8f0")      # Slate 200

    # Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=c_primary,
        spaceAfter=4,
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=c_blue,
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=c_slate_dark,
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=c_slate_dark,
        leftIndent=12,
        spaceAfter=3,
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=c_slate_dark,
    )

    table_bold_cell = ParagraphStyle(
        "TableBoldCell",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=c_primary,
    )

    code_style = ParagraphStyle(
        "CodeText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # Title Block
    story.append(Paragraph("EduRAG Scholar", title_style))
    story.append(Paragraph("Official Client Project Handover & Production Specification Document", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_blue, spaceBefore=0, spaceAfter=12))

    # Metadata Card Table
    meta_data = [
        [Paragraph("Client Name:", table_bold_cell), Paragraph("Asman Musa (makeromusa17@gmail.com)", table_cell_style),
         Paragraph("Date of Delivery:", table_bold_cell), Paragraph("October 2026", table_cell_style)],
        [Paragraph("Project Name:", table_bold_cell), Paragraph("EduRAG Scholar (Chiromo Academic Copilot)", table_cell_style),
         Paragraph("Deployment Status:", table_bold_cell), Paragraph("ACTIVE - Production Live & Verified", table_bold_cell)],
        [Paragraph("Target Audience:", table_bold_cell), Paragraph("UoN Chiromo Campus - B.Sc. Computer Science", table_cell_style),
         Paragraph("Core Architecture:", table_bold_cell), Paragraph("Multi-Tenant Hybrid RAG + Vision OCR", table_cell_style)],
    ]
    t_meta = Table(meta_data, colWidths=[90, 162, 100, 152])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_blue_light),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#bfdbfe")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#dbeafe")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Section 1: Executive Overview
    story.append(Paragraph("1. Executive Project Overview", h1_style))
    story.append(Paragraph(
        "EduRAG Scholar is an enterprise-grade academic learning assistant built for students taking the 7 core Year 2 "
        "Computer Science units at the University of Nairobi. It bridges lecture notes, past exam papers, and textbooks with "
        "autonomous AI retrieval, ensuring strict multi-user privacy, verified slide citations, and spaced repetition.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Section 2: Production Endpoints
    story.append(Paragraph("2. Production Deployment Endpoints", h1_style))
    endpoints_data = [
        [Paragraph("Resource", table_header_style), Paragraph("Provider / Host", table_header_style), Paragraph("Live Production URL", table_header_style)],
        [Paragraph("Frontend Web App", table_bold_cell), Paragraph("Vercel", table_cell_style), Paragraph("https://learningassistant-chi.vercel.app", table_cell_style)],
        [Paragraph("Backend API & Engine", table_bold_cell), Paragraph("Microsoft Azure", table_cell_style), Paragraph("https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net", table_cell_style)],
        [Paragraph("Interactive Swagger Docs", table_bold_cell), Paragraph("Azure Web App", table_cell_style), Paragraph("https://...azurewebsites.net/docs", table_cell_style)],
        [Paragraph("Source Code Repository", table_bold_cell), Paragraph("GitHub", table_cell_style), Paragraph("https://github.com/makeromusa/edurag-scholar", table_cell_style)],
        [Paragraph("Database & Auth Engine", table_bold_cell), Paragraph("Supabase Cloud", table_cell_style), Paragraph("https://xccrkalsujefsghtuirp.supabase.co", table_cell_style)],
        [Paragraph("Document NoSQL Store", table_bold_cell), Paragraph("MongoDB Atlas", table_cell_style), Paragraph("cluster0.ve6rbxy.mongodb.net (db: edurag)", table_cell_style)],
    ]
    t_end = Table(endpoints_data, colWidths=[120, 95, 289])
    t_end.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_end)
    story.append(Spacer(1, 10))

    # Section 3: Core Deliverables & Tested Features
    story.append(Paragraph("3. Verified Deliverables & Completed Features", h1_style))
    features = [
        ("Strict Multi-Tenant Account Isolation:", "Users authenticate via Google OAuth or verified Email/Password. Row-level filters ensure a user only queries and views materials they have personally uploaded. Classmates cannot access each other's data."),
        ("15+ MB Document & Textbook Ingestion:", "High-volume PDF ingestion engine tested on 600+ page textbooks and 15+ MB materials. Includes automated Azure OpenAI gpt-4.1-mini Vision OCR fallback for image-only scans."),
        ("Interactive Slide & Citation Viewer:", "AI answers include clickable [Slide #] citations that immediately open and highlight the corresponding slide page in the synchronized reader."),
        ("Responsive Mobile Architecture:", "Slide-over drawer navigation and a mobile workstation switcher ([AI Copilot] | [Course Materials]) preventing layout breakage on iOS and Android phones."),
        ("Single Polished Sign-In Entry:", "Streamlined single 'Sign In / Register' button in the top header, eliminating redundant buttons from the sidebar."),
        ("Spaced Repetition Suite (SM-2):", "Interactive flashcard review system utilizing the SuperMemo SM-2 algorithm to schedule retention intervals based on difficulty scores."),
        ("3 AM Nightly Abstractor:", "Automated Chiromo lecture timetable synthesis and weakness drill delivery via background cron and SendGrid integration."),
    ]
    for title, desc in features:
        story.append(Paragraph(f"<b>- {title}</b> {desc}", bullet_style))
    story.append(Spacer(1, 10))

    # Section 4: Security & Configuration Schema (Sanitized - No Secrets Exposed)
    story.append(Paragraph("4. Environment & Security Configuration Schema", h1_style))
    story.append(Paragraph(
        "<i>Notice: Sensitive production keys, database passwords, and secrets are securely masked below and stored exclusively in your local protected <code>.env</code> and cloud deployment settings (Vercel & Azure App Settings).</i>",
        body_style
    ))
    story.append(Spacer(1, 4))

    env_table_data = [
        [Paragraph("Variable Name", table_header_style), Paragraph("Component", table_header_style), Paragraph("Configured Value / Status", table_header_style)],
        [Paragraph("SUPABASE_URL", code_style), Paragraph("Supabase", table_cell_style), Paragraph("https://xccrkalsujefsghtuirp.supabase.co", table_cell_style)],
        [Paragraph("SUPABASE_KEY", code_style), Paragraph("Supabase", table_cell_style), Paragraph("[CONFIGURED SECURELY IN VAULT]", table_bold_cell)],
        [Paragraph("SUPABASE_SERVICE_ROLE_KEY", code_style), Paragraph("Supabase Admin", table_cell_style), Paragraph("[CONFIGURED SECURELY IN VAULT]", table_bold_cell)],
        [Paragraph("MONGODB_URI", code_style), Paragraph("MongoDB Atlas", table_cell_style), Paragraph("[PROTECTED ATLAS CLUSTER URI]", table_bold_cell)],
        [Paragraph("AZURE_OPENAI_ENDPOINT", code_style), Paragraph("Azure AI", table_cell_style), Paragraph("https://makeromusa17-0943-resource.../openai/v1", table_cell_style)],
        [Paragraph("AZURE_OPENAI_API_KEY", code_style), Paragraph("Azure AI", table_cell_style), Paragraph("[CONFIGURED SECURELY IN VAULT]", table_bold_cell)],
        [Paragraph("AZURE_OPENAI_CHAT_DEPLOYMENT", code_style), Paragraph("Azure AI", table_cell_style), Paragraph("gpt-4.1-mini", table_cell_style)],
        [Paragraph("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", code_style), Paragraph("Azure AI", table_cell_style), Paragraph("text-embedding-3-small", table_cell_style)],
        [Paragraph("TAVILY_API_KEY", code_style), Paragraph("Search Fallback", table_cell_style), Paragraph("[CONFIGURED SECURELY IN VAULT]", table_bold_cell)],
        [Paragraph("SENDGRID_API_KEY", code_style), Paragraph("SendGrid Email", table_cell_style), Paragraph("[CONFIGURED SECURELY IN VAULT]", table_bold_cell)],
        [Paragraph("SENTRY_DSN", code_style), Paragraph("Observability", table_cell_style), Paragraph("[CONFIGURED SENTRY INGESTION DSN]", table_cell_style)],
    ]
    t_env = Table(env_table_data, colWidths=[165, 85, 254])
    t_env.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_slate_dark),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_env)
    story.append(Spacer(1, 10))

    # Section 5: Operations & Local Dev Guide
    story.append(Paragraph("5. Operations & Developer Maintenance Quickstart", h1_style))
    story.append(Paragraph(
        "<b>Local Startup Commands:</b><br/>"
        "- <b>Backend:</b> <code>cd backend && venv\\Scripts\\activate && uvicorn app.main:app --reload</code> (Port 8000)<br/>"
        "- <b>Frontend:</b> <code>cd frontend && npm run dev</code> (Port 3000)<br/>"
        "<b>Automated Deployment:</b><br/>"
        "- Pushes to the <code>main</code> GitHub branch trigger instant Vercel frontend rebuilds and Azure deployment workflows.",
        body_style
    ))
    story.append(Spacer(1, 12))

    # Sign-off Box
    signoff_data = [
        [Paragraph("<b>Client Sign-Off:</b> Delivered complete, production-ready, and verified for Asman Musa.", ParagraphStyle('Sign', parent=body_style, textColor=c_primary))]
    ]
    t_sign = Table(signoff_data, colWidths=[504])
    t_sign.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "EduRAG_Scholar_Client_Handover.pdf"
    build_pdf(out_path)
