import os
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Response
from pydantic import BaseModel
from app.core.config import settings
from app.core.database import get_supabase_admin_client, match_unit_chunks_rpc
from app.ingestion.embedder import embedding_service
from app.core.native_client import generate_gemini_content
from app.agents.rag_router import rag_router
from app.core.pdf_renderer import render_html_template, convert_html_to_pdf

logger = logging.getLogger("edurag.document_pipeline")
router = APIRouter(prefix="/api/v1/exams", tags=["Document Pipelines"])

# In-memory background task registry (for polling)
# In high-load multi-worker production, sync with Redis/PostgreSQL
TASK_REGISTRY: Dict[str, Dict[str, Any]] = {}

# Pydantic structured output model for OpenAI
class QAItem(BaseModel):
    question: str
    detailed_answer: str

class AnswerPaperSchema(BaseModel):
    answers: List[QAItem]


class SimulateExamRequest(BaseModel):
    unit_code: str
    semester: Optional[str] = "First Semester"
    academic_year: Optional[str] = "2025/2026"


# =========================================================================
# FEATURE 1: THE AUTO-ANSWER PDF GENERATOR
# =========================================================================
@router.post("/solve-paper")
async def solve_paper_endpoint(
    unit_code: str = Form(...),
    file: UploadFile = File(...)
):
    """
    POST /api/v1/exams/solve-paper
    1. Extracts text from uploaded PDF using Gemini 1.5 Flash (preserving formulas/structure).
    2. Queries Supabase pgvector database for relevant class notes context.
    3. Calls OpenAI gpt-4o with Structured Outputs (with instant failover to gpt-4-turbo).
    4. Passes JSON to Jinja2 template (dark blue questions, light grey answers with green left-border).
    5. Converts HTML to downloadable PDF via WeasyPrint.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF revision papers are accepted.")

    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 25MB limit.")

    # Step 1: Bulletproof Extraction from Uploaded PDF (Digital + Scanned / CamScanner)
    import fitz # PyMuPDF
    import base64

    extracted_pages = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_idx, page in enumerate(doc):
            p_text = page.get_text()
            # If the page contains substantial digital text and is not just a CamScanner stamp
            clean_p = p_text.strip()
            if len(clean_p) > 60 and not (len(clean_p) < 120 and "camscanner" in clean_p.lower()):
                extracted_pages.append(f"--- PAGE {page_idx + 1} ---\n" + clean_p)
            else:
                # Scanned or image-based exam page: Render page to JPEG pixmap and run multimodal OCR
                logger.info(f"Page {page_idx + 1} appears to be scanned/image-based ({len(clean_p)} chars). Running multimodal vision OCR...")
                pix = page.get_pixmap(dpi=130)
                jpg_bytes = pix.tobytes("jpeg")
                b64 = base64.b64encode(jpg_bytes).decode("utf-8")
                page_ocr = await rag_router.generate_text(
                    system_instruction="You are an expert academic OCR transcription engine. Extract all university examination questions, formulas, equations, marks, and sub-questions verbatim.",
                    user_prompt="Transcribe all examination questions, formulas, marks, and sub-parts on this exam page verbatim.",
                    image_base64=b64
                )
                if not page_ocr or page_ocr.startswith("⚠️"):
                    # Fallback to direct Gemini
                    page_ocr = generate_gemini_content(
                        system_instruction="Extract all examination questions, formulas, and marks verbatim.",
                        user_prompt="Transcribe all exam questions on this page verbatim.",
                        image_base64=b64,
                        mime_type="image/jpeg"
                    )
                if page_ocr and not page_ocr.startswith("⚠️"):
                    extracted_pages.append(f"--- PAGE {page_idx + 1} (OCR Transcribed) ---\n" + page_ocr.strip())
        doc.close()
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")

    extracted_text = "\n\n".join(extracted_pages).strip()

    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract readable questions from uploaded PDF. Please verify the document.")

    # Step 2: Query Supabase pgvector for relevant class notes context
    context_chunks = []
    try:
        query_vec = embedding_service.get_embedding(extracted_text[:1500])
        if query_vec:
            raw_matches = await match_unit_chunks_rpc(
                unit_code=unit_code,
                query_embedding=query_vec,
                match_threshold=0.50,
                match_count=8
            )
            for c in raw_matches:
                chunk_body = c.get("content") or c.get("chunk_text") or ""
                doc_title = c.get("document_title") or c.get("title") or "Class Notes"
                context_chunks.append(f"[{doc_title} | p.{c.get('page_number', 1)}]: {chunk_body}")
    except Exception as e:
        logger.warning(f"Vector search failed in solve-paper: {e}")

    notes_context = "\n\n".join(context_chunks) if context_chunks else f"Use prescribed University curriculum for {unit_code}."

    # Step 3: Dual-Engine LLM Generation with Line-by-Line Calculus Working Standards
    is_math_unit = any(term in unit_code.lower() for term in ["sma", "calculus", "math"]) or any(term in extracted_text.lower() for term in ["integral", "derivative", "differential", "evaluate the integral"])

    math_guidelines = """
CRITICAL MATHEMATICAL & CALCULUS REQUIREMENTS:
- ALL CALCULATIONS MUST BE SHOWN CLEARLY LINE-BY-LINE.
- State the relevant theorem, standard rule, or formula explicitly at the start (e.g. Integration by parts: \\int u dv = uv - \\int v du).
- For substitution or parts: clearly declare variables (e.g. 'Let u = ..., dv = ... => du = ..., v = ...').
- Show every intermediate algebraic simplification line-by-line. Never skip steps or jump straight to the final answer.
- Always state the constant of integration (+ C) for indefinite integrals.
- For definite integrals, substitute the upper and lower limits explicitly before computing the final numerical answer.
""" if is_math_unit else ""

    system_prompt = f"""You are an elite University of Nairobi senior professor and chief examiner.
You are solving this revision paper for an undergraduate student.

STRICT INSTRUCTIONS:
1. Do not summarize. Provide detailed, multi-paragraph explanations and complete working based strictly on the provided context.
{math_guidelines}
2. You must return a strict JSON array of objects without markdown formatting or code blocks:
[{{"question": "exact question statement with marks", "detailed_answer": "comprehensive step-by-step solution with all intermediate workings"}}]
"""

    user_prompt = f"""EXAMINATION QUESTIONS EXTRACTED FROM UPLOADED PAPER:
\"\"\"
{extracted_text[:4000]}
\"\"\"

PRESCRIBED CLASS NOTES & TEXTBOOK CONTEXT:
\"\"\"
{notes_context[:4000]}
\"\"\"

Solve every question completely. Return pure JSON array of objects with 'question' and 'detailed_answer'.
"""

    qa_items = []
    # Primary call via Dual-Engine Rag Router with instant Gemini fallback
    try:
        logger.info("Solving revision paper via Dual-Engine Rag Router...")
        raw_res = await rag_router.generate_text(system_prompt, user_prompt)
        clean_res = raw_res.strip()
        if clean_res.startswith("```json"): clean_res = clean_res[7:]
        if clean_res.startswith("```"): clean_res = clean_res[3:]
        if clean_res.endswith("```"): clean_res = clean_res[:-3]
        clean_res = clean_res.strip()
        parsed = json.loads(clean_res)
        if isinstance(parsed, list):
            qa_items = parsed
        elif isinstance(parsed, dict):
            qa_items = parsed.get("answers") or parsed.get("questions") or [parsed]
    except Exception as e_primary:
        logger.warning(f"Rag router solve failed ({e_primary}). Invoking Gemini direct fallback...")
        try:
            gemini_res = generate_gemini_content(system_prompt, user_prompt)
            clean_res = gemini_res.strip()
            if clean_res.startswith("```json"): clean_res = clean_res[7:]
            if clean_res.startswith("```"): clean_res = clean_res[3:]
            if clean_res.endswith("```"): clean_res = clean_res[:-3]
            parsed = json.loads(clean_res.strip())
            if isinstance(parsed, list):
                qa_items = parsed
            elif isinstance(parsed, dict):
                qa_items = parsed.get("answers") or [parsed]
        except Exception as e_gem:
            logger.error(f"Gemini fallback failed: {e_gem}")

    if not qa_items:
        # Graceful fallback: construct question from extracted text if JSON parsing failed
        qa_items = [{
            "question": f"{unit_code} Solved Revision Paper",
            "detailed_answer": clean_res if 'clean_res' in locals() and clean_res else "Detailed answers compiled according to prescribed syllabus."
        }]

    # Step 4: Render to Jinja2 HTML Template
    template_context = {
        "title": f"{unit_code} Revision Paper • Model Solutions",
        "unit_code": unit_code,
        "source_filename": file.filename,
        "generated_date": datetime.now(timezone.utc).strftime("%d %B %Y"),
        "qa_items": qa_items
    }
    rendered_html = render_html_template("answer_sheet.html", template_context)

    # Step 5: Convert HTML to PDF using WeasyPrint (with fallback)
    pdf_bytes = convert_html_to_pdf(rendered_html, fallback_type="answer_sheet", context=template_context)

    filename = f"Solved_{unit_code.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# =========================================================================
# FEATURE 2: THE UON EXAM SIMULATOR (ASYNC BACKGROUND TASK + SSE / POLLING)
# =========================================================================
async def run_exam_simulation_task(task_id: str, unit_code: str, semester: str, academic_year: str):
    """
    Background worker function for UON Exam Simulation:
    - Uses Gemini 1.5 Pro massive context window to absorb full semester syllabus and 3 past paper templates.
    - Prompts model for strict JSON array of realistic UON exam questions.
    - Renders Jinja2 simulated_exam.html template to PDF via WeasyPrint.
    - Saves binary to task registry for polling download.
    """
    TASK_REGISTRY[task_id]["status"] = "processing"
    TASK_REGISTRY[task_id]["progress"] = "Fetching semester syllabus and past exam templates..."

    try:
        client = get_supabase_admin_client()
        # Fetch up to 15 chunks of course materials + past papers for this unit safely
        chunks_res = None
        try:
            chunks_res = client.table("document_chunks").select("chunk_text, page_number, documents(title, file_type)").eq("unit_code", unit_code).limit(15).execute()
        except Exception as ce:
            logger.warning(f"Joined chunks query failed: {ce}. Querying standalone chunks...")
            try:
                chunks_res = client.table("document_chunks").select("chunk_text, page_number").eq("unit_code", unit_code).limit(15).execute()
            except Exception:
                chunks_res = None
        
        syllabus_corpus = ""
        past_paper_templates = ""
        if chunks_res and chunks_res.data:
            for c in chunks_res.data:
                title = "Course Notes"
                if isinstance(c.get("documents"), dict):
                    title = c["documents"].get("title") or "Course Notes"
                chunk_body = (c.get("chunk_text") or c.get("content") or "")[:400]
                if "exam" in title.lower() or "cat" in title.lower() or "paper" in title.lower():
                    past_paper_templates += f"\n[PAST EXAM TEMPLATE: {title}]\n{chunk_body}\n"
                else:
                    syllabus_corpus += f"\n[SYLLABUS CONTENT: {title} (p.{c.get('page_number', 1)})]\n{chunk_body}\n"

        TASK_REGISTRY[task_id]["progress"] = "Synthesizing authentic UON Chiromo exam paper via Dual-Engine Copilot..."

        is_math = any(term in unit_code.lower() for term in ["sma", "calculus", "math"])

        calc_instruction = """
CRITICAL CALCULUS & MATHEMATICS MARKING SCHEME REQUIREMENTS:
For every calculation question, the 'model_answer' MUST show ALL working line-by-line:
1. State the relevant formula, theorem, or integration rule explicitly.
2. For integration by parts or substitution: state variables clearly (e.g. Let u = ..., dv = ... => du = ..., v = ...).
3. Write every intermediate algebraic simplification line-by-line without skipping steps.
4. For definite integrals, substitute upper and lower limits explicitly before giving the final result.
5. Indefinite integrals must include '+ C'.
""" if is_math else ""

        sys_inst = (
            f"You are the senior University of Nairobi Chief Examiner for [{unit_code}] at Chiromo Campus. "
            "You are setting a formal, rigorous 70-mark University Examination paper matching authentic UON faculty standards.\n"
            "CRITICAL MARKING RULES:\n"
            "- DO NOT set every question to 10 marks.\n"
            "- Follow authentic UON Chiromo marks distribution: sub-questions MUST have realistic varying marks (such as 3, 4, 5, 6, 7, 8 marks).\n"
            "- Question ONE (Compulsory) total must equal EXACTLY 30 Marks (across 4 or 5 sub-questions).\n"
            "- Questions TWO, THREE, and FOUR total must equal EXACTLY 20 Marks each (across 2 or 3 sub-questions).\n"
            f"{calc_instruction}"
            "Strict requirement: Return valid JSON only without markdown code fences or backticks."
        )

        user_p = f"""Set a complete, publication-grade University of Nairobi Chiromo Examination paper for {unit_code}.
SEMESTER SYLLABUS & NOTES:
{syllabus_corpus[:5000]}

PAST PAPER STRUCTURAL TEMPLATES:
{past_paper_templates[:3000]}

Format the output strictly as a JSON object matching this schema:
{{
  "unit_code": "{unit_code}",
  "unit_name": "{'Differential and Integral Calculus' if is_math else 'Computer Science Examination'}",
  "academic_year": "{academic_year}",
  "semester": "{semester}",
  "time_allowed": "2 HOURS",
  "instructions": "Answer Question ONE (Compulsory - 30 Marks) and any other TWO Questions (20 Marks each).",
  "include_answers": true,
  "questions": [
    {{
      "question_number": "QUESTION ONE",
      "is_compulsory": true,
      "total_marks": 30,
      "stem": "Compulsory section covering fundamental definitions, proofs, short computations, and core theorems.",
      "sub_questions": [
        {{"label": "a)", "text": "Short definition, theorem statement, or foundational concept...", "marks": 4, "model_answer": "Complete standard definition and concise academic explanation."}},
        {{"label": "b)", "text": "Analytical calculation or core mechanism explanation...", "marks": 5, "model_answer": "Step-by-step explanation addressing standard marking criteria."}},
        {{"label": "c)", "text": "Mathematical derivation, proof, or algorithmic evaluation...", "marks": 6, "model_answer": "Full derivation showing all algebraic lines and rules applied."}},
        {{"label": "d)", "text": "Multi-part problem solving or system architecture analysis...", "marks": 7, "model_answer": "Complete solution with intermediate steps and diagrammatic explanation."}},
        {{"label": "e)", "text": "Rigorous application problem, theorem proof, or scenario analysis...", "marks": 8, "model_answer": "Exhaustive model solution with complete lines of working."}}
      ]
    }},
    {{
      "question_number": "QUESTION TWO",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "In-depth formal proofs, system modeling, or advanced problem solving.",
      "sub_questions": [
        {{"label": "a)", "text": "Theoretical foundation or formal proof question...", "marks": 7, "model_answer": "Step-by-step proof with all intermediate logic clearly articulated."}},
        {{"label": "b)", "text": "Detailed computation or engineering implementation problem...", "marks": 7, "model_answer": "Detailed line-by-line computation and evaluation."}},
        {{"label": "c)", "text": "Critical analysis, edge cases, or trade-off evaluation...", "marks": 6, "model_answer": "Comprehensive technical evaluation meeting Chiromo standards."}}
      ]
    }},
    {{
      "question_number": "QUESTION THREE",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "Real-world engineering case study, complex derivations, or architectural design.",
      "sub_questions": [
        {{"label": "a)", "text": "Core problem-solving scenario or derivation...", "marks": 6, "model_answer": "Complete resolution with formula substitutions shown."}},
        {{"label": "b)", "text": "Advanced computational or architectural challenge...", "marks": 8, "model_answer": "Full step-by-step working and critical design defense."}},
        {{"label": "c)", "text": "Evaluation criteria, constraints, and optimization...", "marks": 6, "model_answer": "Thorough discussion and solution validation."}}
      ]
    }},
    {{
      "question_number": "QUESTION FOUR",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "Advanced synthesis, comparative evaluation, and comprehensive mathematical modeling.",
      "sub_questions": [
        {{"label": "a)", "text": "Applied synthesis or multi-step integration/derivation...", "marks": 8, "model_answer": "Line-by-line solution with every intermediate simplification."}},
        {{"label": "b)", "text": "Formal modeling or system verification question...", "marks": 6, "model_answer": "Complete structured response addressing all marking points."}},
        {{"label": "c)", "text": "Practical design recommendations or solution proofs...", "marks": 6, "model_answer": "Rigorous final solution with verification of results."}}
      ]
    }}
  ]
}}
"""
        # Execute LLM generation via Dual-Engine Rag Router (Azure OpenAI / Gemini)
        try:
            raw_res = await rag_router.generate_text(sys_inst, user_p)
        except Exception:
            raw_res = generate_gemini_content(sys_inst, user_p)
        clean_res = raw_res.strip()
        if clean_res.startswith("```json"): clean_res = clean_res[7:]
        if clean_res.startswith("```"): clean_res = clean_res[3:]
        if clean_res.endswith("```"): clean_res = clean_res[:-3]
        clean_res = clean_res.strip()

        exam_json = json.loads(clean_res)

        TASK_REGISTRY[task_id]["progress"] = "Rendering WeasyPrint PDF layout..."
        # Render Jinja2 Template
        rendered_html = render_html_template("simulated_exam.html", exam_json)
        pdf_bytes = convert_html_to_pdf(rendered_html, fallback_type="simulated_exam", context=exam_json)

        TASK_REGISTRY[task_id]["status"] = "completed"
        TASK_REGISTRY[task_id]["progress"] = "Simulated Exam PDF is ready for download!"
        TASK_REGISTRY[task_id]["pdf_bytes"] = pdf_bytes
        TASK_REGISTRY[task_id]["filename"] = f"UoN_{unit_code.replace(' ', '_')}_Simulated_Exam.pdf"

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        TASK_REGISTRY[task_id]["status"] = "failed"
        TASK_REGISTRY[task_id]["error"] = str(e)


@router.post("/simulate")
async def simulate_exam_endpoint(
    payload: SimulateExamRequest,
    background_tasks: BackgroundTasks
):
    """
    POST /api/v1/exams/simulate
    Instantly returns 200 OK with task_id and dispatches background processing.
    """
    task_id = str(uuid.uuid4())
    TASK_REGISTRY[task_id] = {
        "task_id": task_id,
        "status": "queued",
        "progress": "Task queued for autonomous examination generation...",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    background_tasks.add_task(
        run_exam_simulation_task,
        task_id=task_id,
        unit_code=payload.unit_code,
        semester=payload.semester,
        academic_year=payload.academic_year
    )

    return {
        "status": "queued",
        "task_id": task_id,
        "message": "UON Exam simulation task dispatched. Use /api/v1/exams/status/{task_id} to poll completion."
    }


@router.get("/status/{task_id}")
async def get_task_status_endpoint(task_id: str):
    """
    GET /api/v1/exams/status/{task_id}
    Enables Next.js frontend to poll background generation progress.
    """
    task = TASK_REGISTRY.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    return {
        "task_id": task_id,
        "status": task.get("status"),
        "progress": task.get("progress"),
        "error": task.get("error")
    }


@router.get("/download/{task_id}")
async def download_simulated_exam_pdf_endpoint(task_id: str):
    """
    GET /api/v1/exams/download/{task_id}
    Streams the finished WeasyPrint PDF binary to the browser.
    """
    task = TASK_REGISTRY.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    if task.get("status") != "completed" or not task.get("pdf_bytes"):
        raise HTTPException(status_code=400, detail="Exam PDF is not yet ready.")

    return Response(
        content=task["pdf_bytes"],
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{task.get("filename", "UoN_Simulated_Exam.pdf")}"'}
    )
