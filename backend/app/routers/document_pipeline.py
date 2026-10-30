import os
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Response
from pydantic import BaseModel
from openai import OpenAI

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

    # Step 1: Extract text using gemini-1.5-flash / native OCR
    # Convert first pages or full text
    import fitz # PyMuPDF
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        extracted_text = ""
        for page in doc:
            extracted_text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        extracted_text = ""

    # If PyMuPDF found little text (scanned PDF), invoke Gemini multimodal OCR
    if len(extracted_text.strip()) < 50:
        logger.info("Scanned PDF detected. Invoking Gemini 1.5 Flash multimodal parser...")
        import base64
        b64 = base64.b64encode(file_bytes[:3 * 1024 * 1024]).decode("utf-8")
        extracted_text = generate_gemini_content(
            system_instruction="Extract all examination questions, formulas, equations, and numbered parts from this document verbatim.",
            user_prompt="Extract and structure all exam questions found in this paper.",
            image_base64=b64
        )

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract readable questions from uploaded PDF.")

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

    # Step 3: OpenAI gpt-4o with Structured Outputs + Instant Failover to gpt-4-turbo
    system_prompt = (
        "You are an elite academic professor. You are solving this examination paper for a student. "
        "Do not summarize. Provide detailed explanations and full working based strictly on the provided context."
    )
    user_prompt = f"""EXAMINATION QUESTIONS EXTRACTED FROM UPLOADED PAPER:
\"\"\"
{extracted_text[:4000]}
\"\"\"

PRESCRIBED CLASS NOTES & TEXTBOOK CONTEXT:
\"\"\"
{notes_context[:4000]}
\"\"\"

Output a strict JSON array of objects where each object has 'question' and 'detailed_answer'.
"""

    openai_client = OpenAI(
        base_url=settings.AZURE_OPENAI_ENDPOINT or None,
        api_key=settings.AZURE_OPENAI_API_KEY or settings.OPENAI_API_KEY or "none"
    )

    qa_items = []
    # Primary model call with failover
    try:
        logger.info("Calling OpenAI primary model (gpt-4o)...")
        # Try structured parse
        completion = openai_client.beta.chat.completions.parse(
            model=settings.AZURE_OPENAI_CHAT_DEPLOYMENT or "gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=AnswerPaperSchema,
            temperature=0.2
        )
        qa_items = [item.model_dump() for item in completion.choices[0].message.parsed.answers]
    except Exception as e_primary:
        logger.warning(f"gpt-4o failed or rate-limited ({e_primary}). Failing over instantly to gpt-4-turbo...")
        try:
            fallback_completion = openai_client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": system_prompt + " Return valid JSON with an 'answers' list of objects containing 'question' and 'detailed_answer'."},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            raw_json = json.loads(fallback_completion.choices[0].message.content)
            qa_items = raw_json.get("answers", [])
        except Exception as e_fallback:
            logger.error(f"Both gpt-4o and gpt-4-turbo failed: {e_fallback}. Invoking Gemini failover.")
            gemini_res = generate_gemini_content(system_prompt, user_prompt)
            # Clean possible markdown wrap
            clean_res = gemini_res.strip()
            if clean_res.startswith("```json"): clean_res = clean_res[7:]
            if clean_res.startswith("```"): clean_res = clean_res[3:]
            if clean_res.endswith("```"): clean_res = clean_res[:-3]
            try:
                parsed = json.loads(clean_res)
                qa_items = parsed.get("answers", parsed if isinstance(parsed, list) else [])
            except Exception:
                qa_items = [{"question": "Extracted Revision Paper", "detailed_answer": clean_res}]

    if not qa_items:
        raise HTTPException(status_code=500, detail="Failed to synthesize detailed answers.")

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
        # Fetch up to 15 chunks of course materials + past papers for this unit
        chunks_res = client.table("document_chunks").select("content, page_number, documents(title, file_type)").eq("unit_code", unit_code).limit(15).execute()
        
        syllabus_corpus = ""
        past_paper_templates = ""
        if chunks_res.data:
            for c in chunks_res.data:
                title = (c.get("documents") or {}).get("title", "Notes")
                chunk_body = c.get("content", "")[:400]
                if "exam" in title.lower() or "cat" in title.lower() or "paper" in title.lower():
                    past_paper_templates += f"\n[PAST EXAM TEMPLATE: {title}]\n{chunk_body}\n"
                else:
                    syllabus_corpus += f"\n[SYLLABUS CONTENT: {title} (p.{c.get('page_number', 1)})]\n{chunk_body}\n"

        TASK_REGISTRY[task_id]["progress"] = "Synthesizing exam questions via Gemini 1.5 Pro / GPT-4o..."

        sys_inst = (
            f"You are the University of Nairobi Chief Examiner for [{unit_code}]. "
            "You are setting the final degree examination paper. "
            "Strict requirement: Return valid JSON only without code fences."
        )

        user_p = f"""Set a full, formal 70-mark University of Nairobi examination paper for {unit_code}.
SEMESTER SYLLABUS & NOTES:
{syllabus_corpus[:5000]}

PAST PAPER STRUCTURAL TEMPLATES:
{past_paper_templates[:3000]}

Format the output strictly as a JSON object matching this schema:
{{
  "unit_code": "{unit_code}",
  "unit_name": "Computer Science Examination",
  "academic_year": "{academic_year}",
  "time_allowed": "2 HOURS",
  "instructions": "Answer Question ONE (Compulsory - 30 Marks) and any other TWO Questions (20 Marks each).",
  "questions": [
    {{
      "question_number": "QUESTION ONE",
      "is_compulsory": true,
      "total_marks": 30,
      "stem": "Compulsory section covering fundamental definitions, proofs, and core mechanisms.",
      "sub_questions": [
        {{"label": "a)", "text": "Detailed question testing foundational concepts...", "marks": 10}},
        {{"label": "b)", "text": "Architectural or pipeline design question...", "marks": 10}},
        {{"label": "c)", "text": "Scenario-based evaluation or algorithmic derivation...", "marks": 10}}
      ]
    }},
    {{
      "question_number": "QUESTION TWO",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "In-depth system modeling, concurrency proofs, or structural derivation.",
      "sub_questions": [
        {{"label": "a)", "text": "Technical analysis question...", "marks": 10}},
        {{"label": "b)", "text": "Implementation constraints and critical evaluation...", "marks": 10}}
      ]
    }},
    {{
      "question_number": "QUESTION THREE",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "Practical engineering case study, trade-off analysis, or fault tolerance design.",
      "sub_questions": [
        {{"label": "a)", "text": "Problem-solving scenario question...", "marks": 10}},
        {{"label": "b)", "text": "Critical discussion and defense...", "marks": 10}}
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
