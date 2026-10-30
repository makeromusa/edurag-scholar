import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
        if self._pageNumber == 1:
            # Suppress running header/footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header
        self.drawString(54, 755, "Docker Desktop Complete Beginner's Masterclass • Windows 11 & WSL2")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 747, 558, 747)

        # Running Footer
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "EduRAG Scholar Engineering Series • Practical DevOps & Containerization")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()

def create_docker_guide_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0F172A")    # Slate 900
    brand_blue = colors.HexColor("#2563EB")       # Blue 600
    subtle_text = colors.HexColor("#475569")      # Slate 600
    code_bg = colors.HexColor("#1E293B")          # Slate 800
    callout_bg = colors.HexColor("#F1F5F9")       # Slate 100

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=24
    )

    h1_style = ParagraphStyle(
        'ChapterHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=10,
        spaceBefore=0
    )

    h2_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E3A8A"),
        spaceAfter=6,
        spaceBefore=8
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#38BDF8"),
        spaceAfter=0
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    def make_code_box(code_text: str):
        p = Paragraph(code_text.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), code_bg),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ('CORNERPAD', (0,0), (-1,-1), 4),
        ]))
        return t

    def make_callout(text: str, title: str = "PRO-TIP"):
        content = f"<b><font color='#2563EB'>[{title}]</font></b> {text}"
        p = Paragraph(content, callout_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), callout_bg),
            ('LINELEFT', (0,0), (-1,-1), 3.5, brand_blue),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        return t

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("DEVOPS & CONTAINERIZATION ENGINEERING SERIES", ParagraphStyle('TopBadge', fontName='Helvetica-Bold', fontSize=10, textColor=brand_blue, spaceAfter=15)))
    story.append(Paragraph("Docker Desktop for Complete Beginners", title_style))
    story.append(Paragraph("A Comprehensive Visual, Architectural & Hands-On Step-by-Step Guide for Windows 11 & WSL2", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=brand_blue, spaceAfter=25))

    cover_desc = (
        "This masterclass guide takes you from zero knowledge to confident, practical container orchestration. "
        "Learn exactly why Docker was created, how containers differ fundamentally from virtual machines, how "
        "to navigate Docker Desktop on Windows, and how to write production Dockerfiles, manage data volumes, "
        "and orchestrate multi-container systems like your EduRAG Scholar architecture."
    )
    story.append(Paragraph(cover_desc, body_style))
    story.append(Spacer(1, 30))

    meta_table_data = [
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph("Computer Science Students, Junior Developers, DevOps Beginners", body_style)],
        [Paragraph("<b>Operating System:</b>", body_style), Paragraph("Windows 11 / Windows 10 (WSL2 Backend)", body_style)],
        [Paragraph("<b>Docker Version:</b>", body_style), Paragraph("Docker Desktop v29.x & Docker Engine", body_style)],
        [Paragraph("<b>Author / Engineer:</b>", body_style), Paragraph("Musa Makeri • EduRAG Scholar Architecture", body_style)],
        [Paragraph("<b>Date of Publication:</b>", body_style), Paragraph("October 2026", body_style)],
        [Paragraph("<b>Practical Case Study:</b>", body_style), Paragraph("FastAPI, Uvicorn, Tesseract OCR & Python 3.12 Backend", body_style)]
    ]
    meta_table = Table(meta_table_data, colWidths=[150, 354])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 40))
    story.append(make_callout("This guide is self-contained. Keep it downloaded as your permanent desk reference when building, containerizing, or deploying cloud applications.", "START HERE"))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: TABLE OF CONTENTS & LEARNING ROADMAP
    # =========================================================================
    story.append(Paragraph("Table of Contents & Learning Roadmap", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=14))

    toc_data = [
        ["Chapter", "Topic Title", "Key Skills Acquired", "Page"],
        ["Ch. 1", "Why Docker? The Crisis It Solves", "Matrix of Hell, Dependency drift, Portability", "3"],
        ["Ch. 2", "Virtual Machines vs. Containers", "Kernel sharing, Resource overhead, Architecture", "4"],
        ["Ch. 3", "The 4 Core Pillars of Docker", "Images, Containers, Registries, Dockerfiles", "5"],
        ["Ch. 4", "Setting Up Docker Desktop on Windows", "WSL2 backend, BIOS virtualization, Settings", "6"],
        ["Ch. 5", "Tour of Docker Desktop GUI", "Visual dashboard, Containers, Images, Volumes", "7"],
        ["Ch. 6", "Your Very First Docker Commands", "docker run, ps, stop, rm, exec, logs", "8"],
        ["Ch. 7", "Anatomy of a Dockerfile (Line-by-Line)", "FROM, WORKDIR, COPY, RUN, ENV, CMD", "9"],
        ["Ch. 8", "Port Forwarding & Environment Secrets", "Bridge networking, -p host:container, -e flags", "10"],
        ["Ch. 9", "Volumes & Persistent Storage", "Ephemeral containers, Bind mounts, Named volumes", "11"],
        ["Ch. 10", "Case Study: Containerizing EduRAG", "Python 3.12, FastAPI, Tesseract OCR in Docker", "12"],
        ["Ch. 11", "Multi-Container Orchestration (Compose)", "docker-compose.yml, Multi-tier web stacks", "13"],
        ["Ch. 12", "Troubleshooting, Debugging & Pruning", "Interactive shell access, WSL2 errors, Pruning", "14"],
        ["Ch. 13", "The Complete Beginner's Command Cheat Sheet", "30 essential daily commands reference", "15"]
    ]
    t_toc = Table(toc_data, colWidths=[45, 175, 235, 49])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5.5),
        ('TOPPADDING', (0,0), (-1,-1), 5.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t_toc)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Core Learning Objectives", h2_style))
    story.append(Paragraph("By the time you finish this document, you will:", body_style))
    story.append(Paragraph("• Understand the precise difference between an Image (static recipe) and a Container (running process).", bullet_style))
    story.append(Paragraph("• Be comfortable starting, stopping, inspecting, and debugging containers via both GUI and Terminal.", bullet_style))
    story.append(Paragraph("• Know how to craft clean, optimized Dockerfiles that build fast and run with zero host dependencies.", bullet_style))
    story.append(Paragraph("• Master port mapping so outside browsers can seamlessly communicate with containerized servers.", bullet_style))
    story.append(Paragraph("• Deploy full multi-service architectures with a single <code>docker compose up</code> command.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: CHAPTER 1: WHY DOCKER?
    # =========================================================================
    story.append(Paragraph("Chapter 1: Why Docker? The Crisis It Solves", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("The Infamous 'It Works on My Machine' Problem", h2_style))
    story.append(Paragraph(
        "Every software developer in history has encountered this scenario: You write an application on your laptop. "
        "It runs perfectly. You celebrate, commit your code, and send it to your colleague, lecturer, or cloud server. "
        "Five minutes later, they call you: <i>'It crashed immediately with an ImportError: DLL load failed or Version mismatch!'</i>",
        body_style
    ))
    story.append(Paragraph(
        "Why does this happen? Because your laptop has specific operating system libraries, specific Python versions, "
        "hidden environment variables, installed C++ runtimes, and local paths that your teammate's computer does not have. "
        "This is known in software engineering as <b>Environment Drift</b>.",
        body_style
    ))

    story.append(Paragraph("The 'Matrix of Hell'", h2_style))
    story.append(Paragraph(
        "Without Docker, deploying software creates an exponential compatibility matrix: You have 5 different services "
        "(Web Frontend, Python API, PostgreSQL Database, Redis Cache, Background Worker) and you want to run them across "
        "development laptops (Windows 11, macOS Apple Silicon), staging servers (Ubuntu 22.04), and production clouds (Azure, AWS). "
        "Each service requires distinct packages, versions, and system permissions. A single update breaks three other components.",
        body_style
    ))

    story.append(Paragraph("The Shipping Container Metaphor", h2_style))
    story.append(Paragraph(
        "Before the 1950s, cargo shipping was chaotic. Bananas, cars, lumber, and sacks of coffee were individually packed into "
        "ship hulls. Loading took weeks, goods broke, and different ports had incompatible winches and cranes. "
        "Then came the <b>Standardized Intermodal Shipping Container</b>. It doesn't matter what is inside the steel box—whether "
        "it is coffee beans or luxury cars—the box has identical corner castings and dimensions. Any crane, truck, or container "
        "ship in the world can load it instantly.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Docker is the intermodal shipping container for software.</b> Docker wraps your code, your Python runtime, "
        "your exact system libraries (like Tesseract OCR and libgl1), your configuration files, and your dependencies into one "
        "immutable, standardized package. If it runs on your Windows laptop inside Docker, it is 100% mathematically guaranteed "
        "to run identically on your friend's Mac, an Azure virtual server, or a high-performance Kubernetes cluster.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(make_callout(
        "Docker eliminates 'works on my machine' forever. The entire operating environment travels inside the container alongside your code.",
        "CORE PHILOSOPHY"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: CHAPTER 2: VMS VS CONTAINERS
    # =========================================================================
    story.append(Paragraph("Chapter 2: Virtual Machines vs. Containers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("Why Not Just Use VirtualBox or VMware?", h2_style))
    story.append(Paragraph(
        "Beginners often ask: <i>'We already had Virtual Machines (VMs) like VirtualBox. Why did the world need Docker?'</i> "
        "To understand Docker, you must understand the architectural difference between Hardware Virtualization (VMs) "
        "and Operating System Virtualization (Containers).",
        body_style
    ))

    vm_comp_data = [
        ["Feature Comparison", "Traditional Virtual Machine (VM)", "Docker Container"],
        ["Architecture", "Emulates complete physical hardware", "Isolates processes on Host OS Kernel"],
        ["Guest Operating System", "Requires a FULL Guest OS (e.g. 4GB Ubuntu)", "NO Guest OS! Reuses Host Kernel directly"],
        ["Startup Time", "1 to 3 minutes (boots entire BIOS & OS)", "50 to 500 milliseconds (instant process)"],
        ["RAM / CPU Footprint", "Heavy (reserves 2GB-8GB RAM permanently)", "Lightweight (consumes only what process uses)"],
        ["Image Disk Size", "Huge (20 GB to 60 GB .vmdk / .iso)", "Small (50 MB to 500 MB base image)"],
        ["Density per Machine", "Can run 3 to 6 VMs before freezing host", "Can run 50 to 200 containers simultaneously"]
    ]
    t_vm = Table(vm_comp_data, colWidths=[105, 195, 204])
    t_vm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F1F5F9")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_vm)
    story.append(Spacer(1, 14))

    story.append(Paragraph("How Containers Share the Host Kernel", h2_style))
    story.append(Paragraph(
        "A traditional VM runs on top of a <b>Hypervisor</b> (Type 1 or Type 2). The hypervisor tricks the VM into believing "
        "it has real physical CPU chips, real memory sticks, and virtual hard drives. Inside that VM, you must install a complete "
        "Windows or Linux OS with its own kernel, device drivers, background daemons, and system files.",
        body_style
    ))
    story.append(Paragraph(
        "In contrast, Docker uses two ingenious Linux kernel features created by engineers at Google and the Linux community: "
        "<b>1. Namespaces</b> (which provide isolation: process trees, network cards, user accounts, and mount points are hidden "
        "from other containers) and <b>2. Control Groups (cgroups)</b> (which enforce resource quotas: e.g., this container cannot "
        "consume more than 1 CPU core and 512MB RAM).",
        body_style
    ))
    story.append(Paragraph(
        "To the host computer, a container is just a normal, sandboxed process! It starts instantly because there is no BIOS to boot, "
        "no drivers to load, and no virtual hardware to initialize.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(make_callout(
        "Think of a VM as a detached single-family house (its own plumbing, foundation, and roof). Think of a Container as an apartment in a high-rise (shared infrastructure and foundations, but with its own secure private front door).",
        "MENTAL MODEL"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: CHAPTER 3: THE 4 CORE PILLARS
    # =========================================================================
    story.append(Paragraph("Chapter 3: The 4 Core Pillars of Docker", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("The Four Concepts You Must Memorize", h2_style))
    story.append(Paragraph(
        "Every single Docker command, configuration, and architecture is composed of four fundamental building blocks. "
        "Once you understand how these four interact, Docker will feel completely intuitive.",
        body_style
    ))

    pillars_data = [
        ["Pillar", "Technical Definition", "Real-World Analogy"],
        ["1. Dockerfile", "A text file containing step-by-step instructions for building an image.", "The Recipe for a Cake"],
        ["2. Image", "A frozen, read-only template with code, runtime, and libraries.", "The Cake Mix Box in the Supermarket"],
        ["3. Container", "A runnable, isolated, living instance of an Image.", "The Actual Baked Cake on Your Table"],
        ["4. Registry", "A cloud library for sharing, publishing, and downloading Images.", "The Supermarket / App Store (Docker Hub)"]
    ]
    t_pillars = Table(pillars_data, colWidths=[90, 220, 194])
    t_pillars.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pillars)
    story.append(Spacer(1, 14))

    story.append(Paragraph("1. The Dockerfile", h2_style))
    story.append(Paragraph(
        "You write a plain text file named <code>Dockerfile</code> (no extension). In it, you write sequential commands: "
        "Start with Python 3.12, create a working directory <code>/app</code>, copy over <code>requirements.txt</code>, "
        "install dependencies, copy application code, and specify the command that launches the server.",
        body_style
    ))

    story.append(Paragraph("2. The Docker Image (Static & Read-Only)", h2_style))
    story.append(Paragraph(
        "When you run <code>docker build</code>, Docker reads your Dockerfile and compiles it into an <b>Image</b>. "
        "An image is immutable (it cannot be modified once built). It consists of stacked filesystem layers. "
        "Images take up disk space on your drive, but do not consume CPU or RAM because they are not running.",
        body_style
    ))

    story.append(Paragraph("3. The Container (Living & Executing)", h2_style))
    story.append(Paragraph(
        "When you run <code>docker run</code>, Docker takes that frozen image and adds a thin, writable layer on top, creating a "
        "<b>Container</b>. You can create 10 different containers from the exact same image—each container will have its own private "
        "memory space, filesystem changes, and process ID.",
        body_style
    ))

    story.append(Paragraph("4. The Registry (Docker Hub)", h2_style))
    story.append(Paragraph(
        "When you specify <code>FROM python:3.12-slim</code> or <code>docker run postgres</code>, Docker downloads official, "
        "vetted, pre-built images from <b>Docker Hub</b> (the global public registry). You can also create private registries on Azure (ACR) or AWS (ECR).",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: CHAPTER 4: SETTING UP DOCKER ON WINDOWS 11
    # =========================================================================
    story.append(Paragraph("Chapter 4: Setting Up Docker Desktop on Windows 11", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("How Docker Runs on Windows via WSL2", h2_style))
    story.append(Paragraph(
        "Because Linux containers require a Linux kernel, how can Windows run them natively? Microsoft and Docker collaborated "
        "to build deep integration with <b>WSL2 (Windows Subsystem for Linux 2)</b>. WSL2 runs a genuine, hyper-optimized Linux kernel "
        "directly alongside Windows, providing near bare-metal execution speeds and instant file sharing.",
        body_style
    ))

    story.append(Paragraph("Step 1: Verify Hardware Virtualization in BIOS", h2_style))
    story.append(Paragraph(
        "Docker Desktop requires hardware CPU virtualization to be enabled. To check: Open Windows Task Manager "
        "(<code>Ctrl + Shift + Esc</code>), click the <b>Performance</b> tab, select <b>CPU</b>, and look at the bottom right. "
        "It must say <b>Virtualization: Enabled</b>. (If disabled, reboot PC, enter BIOS, and enable Intel VT-x or AMD SVM).",
        body_style
    ))

    story.append(Paragraph("Step 2: Ensure WSL2 is Installed", h2_style))
    story.append(Paragraph(
        "Open PowerShell as Administrator and run the following command to update your WSL kernel to the latest version:",
        body_style
    ))
    story.append(make_code_box("wsl --update\nwsl --status"))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Step 3: Launching Docker Desktop", h2_style))
    story.append(Paragraph(
        "Search for <b>Docker Desktop</b> in your Windows Start Menu and launch it. On initial startup, Docker will ask you to "
        "accept the Service Agreement. Look at the bottom-left corner of the Docker window or your Windows System Tray (near the clock). "
        "You will see the Docker whale icon. When it changes from orange/animating to solid <b>Green</b>, the Docker Engine is running and ready!",
        body_style
    ))

    story.append(Paragraph("Step 4: Crucial Recommended Settings", h2_style))
    story.append(Paragraph(
        "Click the <b>Gear Icon (Settings)</b> in Docker Desktop top-bar to configure optimal performance:",
        body_style
    ))
    story.append(Paragraph("• <b>General:</b> Check <i>'Use the WSL 2 based engine'</i> (default and fastest).", bullet_style))
    story.append(Paragraph("• <b>Resources -> Advanced:</b> Docker on WSL2 dynamically shares host RAM. If your laptop has 16GB RAM, WSL2 typically limits itself to 8GB, ensuring Windows never stutters.", bullet_style))
    story.append(Paragraph("• <b>Resources -> WSL Integration:</b> Toggle ON your Ubuntu / Debian distros if you use Linux terminals.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Step 5: Test from Your Windows Terminal", h2_style))
    story.append(Paragraph("Open PowerShell or Command Prompt and verify both client and server respond:", body_style))
    story.append(make_code_box("docker --version\ndocker info"))
    story.append(Spacer(1, 8))
    story.append(make_callout("If 'docker info' outputs server details without errors, your Windows container engine is 100% healthy!", "HEALTH CHECK"))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: CHAPTER 5: TOUR OF THE GUI
    # =========================================================================
    story.append(Paragraph("Chapter 5: Tour of the Docker Desktop GUI", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("Navigating the Visual Control Center", h2_style))
    story.append(Paragraph(
        "While command-line tools are vital for DevOps, Docker Desktop provides a beautiful, user-friendly graphical interface. "
        "You do not need to memorize obscure commands to inspect logs or stop stuck services. Here is what every screen does:",
        body_style
    ))

    gui_data = [
        ["GUI Section", "What It Shows", "Actions You Can Perform"],
        ["Containers Tab", "List of all active and stopped containers", "Start, Pause, Stop, Delete, View Live Logs, Open in Browser"],
        ["Images Tab", "All downloaded and locally built image recipes", "Run container from image, Inspect layers, Delete old images"],
        ["Volumes Tab", "Persistent virtual hard drives on your machine", "Inspect storage size, Delete orphaned volumes, Export backups"],
        ["Builds Tab", "History of recent docker build runs", "Inspect build cache, View compile errors, Track build durations"],
        ["Extensions Tab", "Marketplace of Docker plugins", "Install disk cleaners, security scanners, and database visualizers"],
        ["Search Bar (Top)", "Direct gateway to Docker Hub", "Search, discover, and pull official images with one click"]
    ]
    t_gui = Table(gui_data, colWidths=[95, 195, 214])
    t_gui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 5.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5.5),
    ]))
    story.append(t_gui)
    story.append(Spacer(1, 14))

    story.append(Paragraph("The Three Superpowers of the Containers Tab", h2_style))
    story.append(Paragraph(
        "When a container is running in Docker Desktop, clicking its name unlocks three developer superpowers:",
        body_style
    ))
    story.append(Paragraph(
        "<b>1. Real-Time Logs:</b> You see stdout/stderr streaming live from your FastAPI or Node.js server. No need to hunt down obscure log files on your hard drive.",
        body_style
    ))
    story.append(Paragraph(
        "<b>2. Terminal (Exec) Tab:</b> Docker Desktop opens an interactive Linux bash/sh prompt inside the container with one click! You can explore files, test Python imports, and inspect environment variables.",
        body_style
    ))
    story.append(Paragraph(
        "<b>3. Resource Stats:</b> Displays live CPU %, RAM usage, network I/O, and disk read/writes with animated charts. You immediately catch memory leaks or runaway infinite loops.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(make_callout(
        "Notice the little square port link (e.g., '8000:8000') next to running containers. Clicking it automatically opens your web browser straight to your containerized application!",
        "SHORTCUT"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: CHAPTER 6: YOUR FIRST COMMANDS (CLI 101)
    # =========================================================================
    story.append(Paragraph("Chapter 6: Your Very First Docker Commands (CLI 101)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("1. The Canonical Sanity Test: Hello World", h2_style))
    story.append(Paragraph("Run the classic diagnostic container in PowerShell:", body_style))
    story.append(make_code_box("docker run hello-world"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>What happened behind the scenes?</b><br/>"
        "1. Docker checked your local disk for an image named 'hello-world:latest'.<br/>"
        "2. Finding none, it contacted Docker Hub and downloaded the tiny 13KB image.<br/>"
        "3. It spawned a new container, executed the program (which prints 'Hello from Docker!'), and immediately exited.",
        body_style
    ))

    story.append(Paragraph("2. Running a Real Web Server (NGINX)", h2_style))
    story.append(Paragraph("Now launch a real, enterprise-grade web server in detached mode with port forwarding:", body_style))
    story.append(make_code_box("docker run -d -p 8080:80 --name my-webserver nginx"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Breakdown of the flags you will use every day:<br/>"
        "• <b><code>-d</code> (Detached):</b> Runs the container in the background, freeing your terminal immediately.<br/>"
        "• <b><code>-p 8080:80</code> (Port Map):</b> Connects port 8080 on your Windows host to port 80 inside the container.<br/>"
        "• <b><code>--name my-webserver</code>:</b> Assigns a human-readable name instead of an auto-generated random ID.<br/>"
        "Now open <code>http://localhost:8080</code> in Edge or Chrome. You will see the Welcome to NGINX home page!",
        body_style
    ))

    story.append(Paragraph("3. Inspecting What is Running", h2_style))
    story.append(make_code_box("docker ps          # Lists only ACTIVE running containers\ndocker ps -a       # Lists ALL containers (including stopped & exited)"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("4. Viewing Live Logs", h2_style))
    story.append(make_code_box("docker logs my-webserver\ndocker logs -f my-webserver   # -f follows (streams) logs live"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("5. Stopping and Removing Containers", h2_style))
    story.append(make_code_box("docker stop my-webserver     # Sends SIGTERM for graceful shutdown\ndocker rm my-webserver       # Deletes the stopped container instance\ndocker rm -f my-webserver    # Force stops and deletes in 1 step"))
    story.append(Spacer(1, 8))
    story.append(make_callout("Remember: Stopping a container retains its state. Removing ('docker rm') permanently deletes that container instance.", "CONTAINER LIFECYCLE"))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: CHAPTER 7: ANATOMY OF A DOCKERFILE
    # =========================================================================
    story.append(Paragraph("Chapter 7: Anatomy of a Dockerfile (Line-by-Line)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("How to Write a Production Recipe", h2_style))
    story.append(Paragraph(
        "A <code>Dockerfile</code> is simply a sequential blueprint. Docker executes it from top to bottom, caching each step "
        "as a discrete filesystem layer. Here is a complete, production-grade Dockerfile for a Python application:",
        body_style
    ))

    sample_df = (
        "# 1. Base Image\n"
        "FROM python:3.12-slim\n\n"
        "# 2. Working Directory inside container\n"
        "WORKDIR /app\n\n"
        "# 3. Install OS-level dependencies\n"
        "RUN apt-get update && apt-get install -y --no-install-recommends \\\n"
        "    curl \\\n"
        "    && rm -rf /var/lib/apt/lists/*\n\n"
        "# 4. Copy dependency specification FIRST (Leverage Cache)\n"
        "COPY requirements.txt .\n"
        "RUN pip install --no-cache-dir -r requirements.txt\n\n"
        "# 5. Copy remaining application source code\n"
        "COPY . .\n\n"
        "# 6. Set environment variables & declare port\n"
        "ENV PYTHONUNBUFFERED=1\n"
        "EXPOSE 8000\n\n"
        "# 7. Default Execution Command\n"
        "CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]"
    )
    story.append(make_code_box(sample_df))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Deep Dive: What Each Directive Does", h2_style))
    story.append(Paragraph("• <b><code>FROM python:3.12-slim</code>:</b> Always start from an official minimal base image. The <code>-slim</code> variant is stripped of unnecessary compilers and manuals, reducing image size from 1GB down to ~150MB.", bullet_style))
    story.append(Paragraph("• <b><code>WORKDIR /app</code>:</b> Sets the working directory for all subsequent instructions. Creates the folder automatically if it does not exist.", bullet_style))
    story.append(Paragraph("• <b><code>COPY requirements.txt .</code>:</b> The Golden Rule of Docker Caching! Notice we copy requirements.txt and run pip install <i>before</i> copying the rest of our source code. Why? Because source code changes constantly, but dependencies change rarely. By separating them, Docker reuses cached pip installs in under 1 second!", bullet_style))
    story.append(Paragraph("• <b><code>EXPOSE 8000</code>:</b> Documents which internal port the container listens on. (It does not publish the port to your host; <code>-p</code> does that).", bullet_style))
    story.append(Paragraph("• <b><code>CMD [...]</code>:</b> The executable launched when <code>docker run</code> is called. Always use the JSON array syntax <code>[\"prog\", \"arg1\"]</code>.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: CHAPTER 8: PORT FORWARDING & SECRETS
    # =========================================================================
    story.append(Paragraph("Chapter 8: Port Forwarding & Environment Secrets", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("The Network Boundary: Why Can't I Access Port 8000?", h2_style))
    story.append(Paragraph(
        "A container lives in its own private, isolated network namespace with its own virtual IP address (e.g. <code>172.17.0.2</code>). "
        "If your server listens on port 8000 inside the container, your Windows browser on the outside has no way to reach it unless you open a portal.",
        body_style
    ))
    story.append(Paragraph(
        "That portal is created with the <b><code>-p</code> (publish)</b> flag:",
        body_style
    ))
    story.append(make_code_box("# Syntax: -p <HostPortOnWindows>:<ContainerInternalPort>\ndocker run -d -p 8000:8000 my-python-app"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Port Collision Resolution:</b> What if your host machine is already running another application on port 8000? "
        "You do not need to change a single line of your Python code! Simply remap the host side:",
        body_style
    ))
    story.append(make_code_box("docker run -d -p 8085:8000 my-python-app"))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Now you access your application at <code>http://localhost:8085</code>. The traffic routes smoothly into container port 8000.", body_style))

    story.append(Paragraph("Managing Secrets and Environment Variables", h2_style))
    story.append(Paragraph(
        "<b>CRITICAL SECURITY RULE:</b> Never hardcode database passwords, Supabase keys, or OpenAI API keys inside your Dockerfile! "
        "If you do, anyone who pulls your image can read your secrets.",
        body_style
    ))
    story.append(Paragraph("Instead, inject secrets at runtime using either the <code>-e</code> flag or <code>--env-file</code>:", body_style))
    story.append(make_code_box(
        "# Method A: Single variable flag\n"
        "docker run -e AZURE_OPENAI_API_KEY=\"xyz\" -e ENVIRONMENT=\"production\" my-app\n\n"
        "# Method B: Load entire .env file (Cleanest & Recommended)\n"
        "docker run -d -p 8000:8000 --env-file .env my-app"
    ))
    story.append(Spacer(1, 10))
    story.append(make_callout(
        "Always add .env to your .dockerignore file! This ensures your local secret files are never accidentally baked into public container images.",
        "DEVSECOPS BEST PRACTICE"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: CHAPTER 9: VOLUMES & PERSISTENCE
    # =========================================================================
    story.append(Paragraph("Chapter 9: Volumes & Persistent Storage", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("Containers are Ephemeral (Stateless)", h2_style))
    story.append(Paragraph(
        "By design, containers are meant to be disposable. If a container crashes, you delete it and spin up a new one in 200ms. "
        "However, that poses a dilemma: <i>What happens to database files, uploaded PDFs, or chat history stored inside the container?</i> "
        "<b>They are deleted permanently!</b>",
        body_style
    ))
    story.append(Paragraph(
        "To persist data beyond container lifecycles, Docker provides <b>Volumes</b> and <b>Bind Mounts</b>.",
        body_style
    ))

    vol_comp = [
        ["Storage Type", "Where Data Lives on Disk", "Best Used For"],
        ["Named Volume", "Managed by Docker inside internal WSL2 storage", "Databases (Postgres, Mongo), Persistent Caches"],
        ["Bind Mount", "Direct folder on your Windows host (e.g. C:\\Projects)", "Live Source Code editing with hot-reloading"],
        ["tmpfs Mount", "RAM only (never touches physical disk)", "Sensitive temporary keys, fast ephemeral buffers"]
    ]
    t_vol = Table(vol_comp, colWidths=[100, 204, 200])
    t_vol.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_vol)
    story.append(Spacer(1, 14))

    story.append(Paragraph("1. Using Named Volumes (e.g. for PostgreSQL)", h2_style))
    story.append(make_code_box(
        "# Create a named volume\n"
        "docker volume create edurag_db_data\n\n"
        "# Mount it to Postgres internal data folder\n"
        "docker run -d -v edurag_db_data:/var/lib/postgresql/data -p 5432:5432 postgres:16"
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Even if you run <code>docker rm -f</code> on that database container, your data remains safely stored in <code>edurag_db_data</code>. Attach it to a new container and your tables reappear instantly.", body_style))

    story.append(Paragraph("2. Using Bind Mounts for Live Hot-Reloading", h2_style))
    story.append(Paragraph(
        "When developing code, you don't want to rebuild your Docker image every time you save a line of Python! "
        "Bind-mount your local Windows source code directly into the container:",
        body_style
    ))
    story.append(make_code_box(
        "# Windows PowerShell syntax: ${PWD} maps current directory\n"
        "docker run -d -p 8000:8000 -v ${PWD}:/app edurag-backend:latest"
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Now, every time you edit a <code>.py</code> file in VS Code on Windows, Uvicorn inside the container detects the file change and reloads immediately!", body_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: CHAPTER 10: CASE STUDY - EDURAG BACKEND
    # =========================================================================
    story.append(Paragraph("Chapter 10: Hands-On: Containerizing EduRAG Backend", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("The Exact Dockerfile from Your Codebase", h2_style))
    story.append(Paragraph(
        "Let's look at the actual <code>backend/Dockerfile</code> inside your EduRAG repository. "
        "It solves a specific, complex problem: your app needs <b>Tesseract OCR</b> to parse past exam papers.",
        body_style
    ))

    story.append(make_code_box(
        "FROM python:3.12-slim\n\n"
        "WORKDIR /app\n\n"
        "# System dependencies: Tesseract OCR + build tools\n"
        "RUN apt-get update && apt-get install -y --no-install-recommends \\\n"
        "    build-essential \\\n"
        "    tesseract-ocr \\\n"
        "    curl \\\n"
        "    && rm -rf /var/lib/apt/lists/*\n\n"
        "COPY requirements.txt .\n"
        "RUN pip install --no-cache-dir -r requirements.txt\n\n"
        "COPY . .\n\n"
        "ENV PYTHONUNBUFFERED=1\n"
        "ENV PORT=8000\n\n"
        "EXPOSE 8000\n\n"
        "CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]"
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Step-by-Step Execution Guide", h2_style))
    story.append(Paragraph("Open PowerShell, navigate to your <code>backend</code> directory, and execute:", body_style))

    story.append(make_code_box(
        "# Step 1: Navigate to backend\n"
        "cd c:\\Users\\HomePC\\.gemini\\antigravity\\scratch\\academic-rag-copilot\\backend\n\n"
        "# Step 2: Build the image tagged as 'edurag-backend:v1'\n"
        "docker build -t edurag-backend:v1 .\n\n"
        "# Step 3: Run the container with your .env secrets and port 8000 mapped\n"
        "docker run -d --name edurag-live -p 8000:8000 --env-file .env edurag-backend:v1\n\n"
        "# Step 4: Verify health & logs\n"
        "docker logs -f edurag-live"
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("What Happens Under the Hood?", h2_style))
    story.append(Paragraph(
        "Docker downloads Debian Linux, installs the genuine Linux Tesseract OCR binary, installs FastAPI, Pydantic, "
        "and SlowAPI, mounts your environment variables, and exposes port 8000. You can now open your browser or Postman "
        "and hit <code>http://localhost:8000/api/units</code>—it responds with your 7 Chiromo units in milliseconds!",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: CHAPTER 11: DOCKER COMPOSE
    # =========================================================================
    story.append(Paragraph("Chapter 11: Multi-Container Orchestration (Compose)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("Why Typing Long Docker Run Commands Gets Painful", h2_style))
    story.append(Paragraph(
        "Real-world applications rarely consist of just one container. Your full stack includes: a Next.js Frontend, "
        "a FastAPI Backend, a PostgreSQL vector database, and maybe a Redis cache. Typing five separate <code>docker run</code> "
        "commands with dozens of port flags and environment variables every morning is tedious and error-prone.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Docker Compose</b> solves this by defining your entire multi-container architecture in a single declarative YAML file: <code>docker-compose.yml</code>.",
        body_style
    ))

    compose_yaml = (
        "version: '3.8'\n\n"
        "services:\n"
        "  backend:\n"
        "    build:\n"
        "      context: ./backend\n"
        "      dockerfile: Dockerfile\n"
        "    ports:\n"
        "      - \"8000:8000\"\n"
        "    env_file:\n"
        "      - ./backend/.env\n"
        "    restart: unless-stopped\n\n"
        "  frontend:\n"
        "    build:\n"
        "      context: ./frontend\n"
        "      dockerfile: Dockerfile\n"
        "    ports:\n"
        "      - \"3000:3000\"\n"
        "    environment:\n"
        "      - NEXT_PUBLIC_API_URL=http://backend:8000\n"
        "    depends_on:\n"
        "      - backend"
    )
    story.append(make_code_box(compose_yaml))
    story.append(Spacer(1, 10))

    story.append(Paragraph("The Three Magical Compose Commands", h2_style))
    story.append(make_code_box(
        "# Start entire multi-tier system in background\n"
        "docker compose up -d\n\n"
        "# View combined, color-coded logs from all services\n"
        "docker compose logs -f\n\n"
        "# Stop and clean up all containers, networks, and bridges\n"
        "docker compose down"
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Automatic Internal DNS Networking:</b> Notice in the frontend config above: <code>http://backend:8000</code>. "
        "Docker Compose automatically creates a shared virtual network and assigns DNS names matching your service keys! "
        "Containers can talk to each other by name with zero hardcoded IP addresses.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 14: CHAPTER 12: TROUBLESHOOTING & DEBUGGING
    # =========================================================================
    story.append(Paragraph("Chapter 12: Troubleshooting, Debugging & Pruning", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("1. How to 'SSH' Inside a Running Container", h2_style))
    story.append(Paragraph(
        "When an unexpected bug occurs, you often want to explore the container's files directly. "
        "Use <code>docker exec</code> to open an interactive bash shell:",
        body_style
    ))
    story.append(make_code_box(
        "# Open an interactive shell inside your running container\n"
        "docker exec -it edurag-live bash\n\n"
        "# Once inside (Linux prompt): explore files and test Python\n"
        "ls -la\n"
        "python -c \"import pymupdf; print('PyMuPDF OK!')\"\n"
        "exit"
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("2. Top 3 Common Beginner Errors on Windows & How to Fix Them", h2_style))

    trouble_data = [
        ["Error Message", "Root Cause", "Immediate Fix"],
        ["'bind: address already in use'", "Port 8000 is occupied by another app", "Change host port: -p 8080:8000 or kill the old process"],
        ["'Cannot connect to Docker daemon'", "Docker Desktop engine is stopped", "Launch Docker Desktop app and wait for green icon"],
        ["'no space left on device'", "Old unused images & build cache filled WSL2", "Run 'docker system prune -a' to free disk space"]
    ]
    t_tr = Table(trouble_data, colWidths=[130, 160, 214])
    t_tr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 5.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5.5),
    ]))
    story.append(t_tr)
    story.append(Spacer(1, 10))

    story.append(Paragraph("3. Housekeeping: Freeing Up Disk Space", h2_style))
    story.append(Paragraph(
        "Over months of development, old intermediate build layers accumulate on your hard drive. "
        "Docker includes a built-in garbage collector:",
        body_style
    ))
    story.append(make_code_box(
        "# Safely removes stopped containers, dangling images, and unused networks\n"
        "docker system prune\n\n"
        "# Deep clean: Removes ALL unused images and build cache (reclaims 10GB-30GB!)\n"
        "docker system prune -a --volumes"
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 15: CHAPTER 13: CHEAT SHEET & QUICK REFERENCE
    # =========================================================================
    story.append(Paragraph("Chapter 13: Complete Beginner's Command Cheat Sheet", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    story.append(Paragraph("The Top 20 Daily Docker Commands You Will Actually Use", h2_style))

    cheat_data = [
        ["Category", "Command", "Description"],
        ["Run / Start", "docker run -d -p 80:80 nginx", "Run container in background with port 80 mapped"],
        ["Run / Start", "docker run -it ubuntu bash", "Launch interactive Ubuntu container with shell"],
        ["Inspect", "docker ps", "List all actively running containers"],
        ["Inspect", "docker ps -a", "List all containers including stopped ones"],
        ["Inspect", "docker logs -f <id/name>", "Follow and stream live console logs"],
        ["Inspect", "docker stats", "Display live CPU, RAM, and Network I/O metrics"],
        ["Manage", "docker stop <id/name>", "Gracefully stop a running container"],
        ["Manage", "docker start <id/name>", "Restart a previously stopped container"],
        ["Manage", "docker restart <id/name>", "Quick restart of container"],
        ["Manage", "docker rm -f <id/name>", "Force remove a container instance"],
        ["Build", "docker build -t myapp:1.0 .", "Build image from Dockerfile in current folder"],
        ["Build", "docker images", "List all local images stored on disk"],
        ["Build", "docker rmi <image-id>", "Delete an image from local disk"],
        ["Exec", "docker exec -it <id> bash", "Open an interactive bash shell inside container"],
        ["Volumes", "docker volume ls", "List all persistent named volumes"],
        ["Volumes", "docker volume create <name>", "Create a new named persistent volume"],
        ["Compose", "docker compose up -d", "Build and launch multi-service application"],
        ["Compose", "docker compose down", "Stop and destroy multi-service containers"],
        ["Clean", "docker system prune", "Remove stopped containers and dangling images"],
        ["Clean", "docker system prune -a", "Deep clean all unused images and build caches"]
    ]
    t_ch = Table(cheat_data, colWidths=[65, 175, 264])
    t_ch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.2),
    ]))
    story.append(t_ch)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Final Checklist for Production Containerization", h2_style))
    story.append(Paragraph("1. Always use <code>.dockerignore</code> to omit <code>node_modules</code>, <code>venv</code>, and <code>.env</code> files.", bullet_style))
    story.append(Paragraph("2. Optimize layer caching: Copy dependency files (requirements.txt, package.json) before copying application source code.", bullet_style))
    story.append(Paragraph("3. Never store state or database rows directly inside the container root filesystem; use persistent Volumes.", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("© 2026 EduRAG Scholar Engineering Series • Created for Musa Makeri • Masterclass Complete.", ParagraphStyle('EndNotice', fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor("#64748B"), alignment=1)))

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_path}")

if __name__ == "__main__":
    downloads_path = r"C:\Users\HomePC\Downloads\Docker_Desktop_Beginners_Guide_Masterclass.pdf"
    create_docker_guide_pdf(downloads_path)
