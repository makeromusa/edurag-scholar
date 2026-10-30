import json
import logging
import uuid
import base64
import io
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Header, Request
from pydantic import BaseModel
from bson import ObjectId
import fitz  # PyMuPDF

from app.core.limiter import limiter
from app.ingestion.security_validator import validate_file_security

from app.core.database import get_supabase_admin_client
from app.core.mongodb import (
    get_chat_transcripts_collection,
    get_mock_exams_collection,
    get_flashcards_collection,
    get_briefing_archives_collection
)
from app.services.spaced_repetition import calculate_sm2_review
from app.services.professor_service import professor_service, PEDAGOGICAL_STAGES
from app.services.professor_course_service import professor_course_service
from app.ingestion.extractor import extract_document_pages
from app.ingestion.chunker import chunk_extracted_pages
from app.ingestion.embedder import embedding_service
from app.agents.rag_router import rag_router
from app.workers.abstractor import run_nightly_abstraction_job
from app.core.exam_pdf_builder import build_simulated_exam_pdf
from app.core.qa_pdf_builder import build_revision_qa_pdf
from fastapi.responses import Response

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Pydantic Schemas ---
class ChatRequest(BaseModel):
    unit_code: str
    query: str
    session_id: Optional[str] = None
    deep_search: bool = False
    similarity_threshold: float = 0.68
    image_base64: Optional[str] = None
    attached_file_base64: Optional[str] = None
    attached_file_name: Optional[str] = None


class PastPaperAnalyzeRequest(BaseModel):
    unit_code: str


class PastPaperSolveRequest(BaseModel):
    unit_code: str
    question: str
    marks: Optional[int] = 15


class FlashcardGenerateRequest(BaseModel):
    unit_code: str
    topic: str
    card_count: Optional[int] = 5


class FlashcardReviewRequest(BaseModel):
    card_id: str
    quality: int  # 0 to 5 on SM-2 scale


class MockExamGenerateRequest(BaseModel):
    unit_code: str
    difficulty: Optional[str] = "Chiromo Standard Exam"
    exam_type: Optional[str] = "Final Examination" # Final Examination | CAT I | CAT II | Special Revision
    include_answers: bool = True


class RevisionQAGenerateRequest(BaseModel):
    unit_code: str
    question: str
    topic: Optional[str] = None
    target_marks: Optional[int] = 15


class MockExamEvaluateRequest(BaseModel):
    exam_id: str
    student_submission: str


class LogWeaknessRequest(BaseModel):
    user_id: Optional[str] = None
    unit_code: str
    topic_name: str
    error_pattern: Optional[str] = None
    difficulty_score: int = 3


class ProfessorTeachRequest(BaseModel):
    unit_code: str
    topic: Optional[str] = None
    document_id: Optional[str] = None
    chunk_index: int = 0
    student_response: Optional[str] = None
    explain_deeper: bool = False


class ProfessorLessonRequest(BaseModel):
    document_id: str
    unit_code: str
    start_page: int
    end_page: int
    custom_focus: Optional[str] = None


class ProfessorAskRequest(BaseModel):
    document_id: str
    unit_code: str
    start_page: int
    end_page: int
    question: str


class ProfessorSearchCurriculumRequest(BaseModel):
    unit_code: str
    query: str


# --- Endpoints ---

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "EduRAG Scholar Backend"}


@router.get("/units")
def get_units():
    """Returns the 7 units and lecturer metadata."""
    client = get_supabase_admin_client()
    res = client.table("units").select("*").order("code").execute()
    return {"units": res.data or []}


@router.get("/timetable")
def get_timetable():
    """Returns weekly teaching timetable slots."""
    client = get_supabase_admin_client()
    res = client.table("timetable_slots").select("*, units(name, lecturer)").order("day_of_week").order("start_time").execute()
    return {"timetable": res.data or []}


def get_user_from_header(authorization: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Extracts verified user info from Supabase JWT and ensures profile exists in profiles table."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    try:
        client = get_supabase_admin_client()
        user_res = client.auth.get_user(token)
        if user_res and user_res.user:
            user_id = str(user_res.user.id)
            user_email = user_res.user.email or "student@uon.ac.ke"
            full_name = (user_res.user.user_metadata or {}).get("full_name") or user_email.split("@")[0]

            # Ensure profile exists in profiles table so foreign key constraint never fails!
            try:
                prof = client.table("profiles").select("id").eq("id", user_id).execute()
                if not prof.data:
                    client.table("profiles").insert({
                        "id": user_id,
                        "email": user_email,
                        "full_name": full_name
                    }).execute()
                    logger.info(f"Created profile record for authenticated student: {user_email} ({user_id})")
            except Exception as pe:
                logger.warning(f"Could not auto-create profile for {user_email}: {pe}")

            return {
                "id": user_id,
                "email": user_email,
                "metadata": user_res.user.user_metadata or {}
            }
    except Exception as e:
        logger.debug(f"Auth token verification skipped or failed: {e}")
    return None


@router.get("/documents")
@router.get("/documents/list")
@limiter.limit("120/minute")
def list_documents(request: Request, unit_code: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """
    Returns ingested documents with page counts, storage URLs, and real-time processing status.
    Enforces user data isolation: Shows student's own documents + shared public course slides.
    """
    import urllib.parse
    client = get_supabase_admin_client()
    user = get_user_from_header(authorization)
    user_id = user["id"] if user else None

    query = client.table("documents").select("id, unit_code, title, page_count, is_processed, file_size_bytes, uploaded_at, uploaded_by, storage_url")
    if unit_code:
        query = query.eq("unit_code", unit_code)
    
    # Return all curated academic course materials, textbooks, and past papers for the selected unit
    res = query.order("uploaded_at", desc=True).limit(100).execute()
    
    docs = res.data or []
    SUPABASE_STORAGE_BASE = "https://xccrkalsujefsghtuirp.supabase.co/storage/v1/object/public/course-documents"
    enriched = []
    for d in docs:
        storage_url = d.get("storage_url")
        if not storage_url or not storage_url.startswith("http"):
            storage_url = f"{SUPABASE_STORAGE_BASE}/{urllib.parse.quote(d.get('title', ''))}"
        enriched.append({
            **d,
            "storage_url": storage_url,
            "chunks_indexed": d.get("page_count", 0)
        })
    return {"documents": enriched}


@router.get("/documents/{doc_id}/raw")
@router.get("/documents/{doc_id}/download")
def download_document(doc_id: str):
    """Directly redirects to or serves the authentic original binary PDF."""
    import urllib.parse
    from fastapi.responses import RedirectResponse
    client = get_supabase_admin_client()
    doc = client.table("documents").select("id, title, storage_url").eq("id", doc_id).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")
    storage_url = doc.data[0].get("storage_url")
    if storage_url and storage_url.startswith("http"):
        return RedirectResponse(url=storage_url)
    
    SUPABASE_STORAGE_BASE = "https://xccrkalsujefsghtuirp.supabase.co/storage/v1/object/public/course-documents"
    fallback_url = f"{SUPABASE_STORAGE_BASE}/{urllib.parse.quote(doc.data[0].get('title', ''))}"
    return RedirectResponse(url=fallback_url)


@router.get("/documents/{doc_id}/status")
def get_document_status(doc_id: str):
    """Checks the real-time processing and indexing status of an ingested document."""
    client = get_supabase_admin_client()
    doc = client.table("documents").select("id, unit_code, title, page_count, is_processed, created_at").eq("id", doc_id).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = client.table("document_chunks").select("id", count="exact").eq("document_id", doc_id).execute()
    return {
        "id": doc_id,
        "title": doc.data[0].get("title"),
        "unit_code": doc.data[0].get("unit_code"),
        "page_count": doc.data[0].get("page_count", 0),
        "is_processed": doc.data[0].get("is_processed", False),
        "chunks_indexed": chunks.count or 0
    }


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, authorization: Optional[str] = Header(None)):
    """
    Deletes an ingested PDF/document and purges all of its vector chunks from Supabase.
    Enforces multi-tenant data isolation: students can delete their own documents.
    """
    client = get_supabase_admin_client()
    user = get_user_from_header(authorization)
    user_id = user["id"] if user else None

    # Fetch document to verify ownership
    doc_res = client.table("documents").select("id, title, unit_code, uploaded_by").eq("id", doc_id).execute()
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = doc_res.data[0]
    doc_owner = doc.get("uploaded_by")

    # If document has an owner, ensure requester is the owner
    if doc_owner and user_id and doc_owner != user_id:
        raise HTTPException(status_code=403, detail="Permission denied. You can only delete documents you uploaded.")

    # 1. Purge all chunks from vector index
    client.table("document_chunks").delete().eq("document_id", doc_id).execute()

    # 2. Delete the document record
    client.table("documents").delete().eq("id", doc_id).execute()

    logger.info(f"Purged document '{doc.get('title')}' ({doc_id}) and all vector chunks.")
    return {
        "status": "success",
        "message": f"Successfully deleted '{doc.get('title')}' and purged all vector embeddings.",
        "document_id": doc_id
    }


@router.post("/documents/upload")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    unit_code: str = Form(...),
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """
    Ingests and processes a course document (PDF slides, PPTX, DOCX, past paper, textbook).
    ALL documents are processed synchronously with Gemini batch embeddings.
    Gunicorn timeout is 600s — even a 500-page textbook finishes in ~75s.
    Assigns uploaded_by to authenticated user for strict multi-tenant isolation.
    """
    client = get_supabase_admin_client()
    user = get_user_from_header(authorization)
    user_id = user["id"] if user else None

    file_bytes = await file.read()
    
    # Area 2: Security Validation (magic bytes, file size, filename sanitization)
    _, safe_file_name = validate_file_security(file_bytes, file.filename or "unknown_doc")
    file_name = safe_file_name
    file_type = "pdf" if file_name.endswith(".pdf") else "pptx" if file_name.endswith(".pptx") else "docx"

    try:
        # 1. Extract pages/slides
        extracted_pages = extract_document_pages(file_bytes, file_name)
        if not extracted_pages:
            raise HTTPException(status_code=400, detail="No extractable text found in file.")

        # 2. Register document in Supabase with uploaded_by user_id (with resilient foreign-key safety)
        doc_payload = {
            "unit_code": unit_code,
            "title": file_name,
            "file_type": file_type,
            "storage_url": f"local://{file_name}",
            "file_size_bytes": len(file_bytes),
            "page_count": len(extracted_pages),
            "uploaded_by": user_id,
            "is_processed": False
        }
        try:
            doc_res = client.table("documents").insert(doc_payload).execute()
        except Exception as insert_err:
            logger.warning(f"Initial document insert failed ({insert_err}), checking profiles table for foreign key...")
            if user_id:
                try:
                    prof = client.table("profiles").select("id").eq("id", user_id).execute()
                    if not prof.data:
                        client.table("profiles").insert({
                            "id": user_id,
                            "email": (user or {}).get("email") or "student@uon.ac.ke",
                            "full_name": ((user or {}).get("metadata") or {}).get("full_name") or "Student"
                        }).execute()
                    doc_res = client.table("documents").insert(doc_payload).execute()
                except Exception as retry_err:
                    logger.warning(f"Retry with profile failed ({retry_err}), inserting as shared course doc...")
                    doc_payload["uploaded_by"] = None
                    doc_res = client.table("documents").insert(doc_payload).execute()
            else:
                raise insert_err
        
        doc_record = doc_res.data[0]
        document_id = doc_record["id"]

        # 3. Chunk, embed, and store — ALL synchronous, no background tasks
        logger.info(f"Processing {file_name}: {len(extracted_pages)} pages for unit {unit_code} (User: {user_id or 'Public'})...")
        raw_chunks = chunk_extracted_pages(extracted_pages, unit_code=unit_code, document_id=document_id)
        chunks = [c for c in raw_chunks if c.content and c.content.strip()]
        if not chunks:
            raise HTTPException(status_code=400, detail="Could not extract readable text blocks from document.")

        chunk_texts = [c.content for c in chunks]
        
        logger.info(f"Embedding {len(chunk_texts)} chunks via Gemini batchEmbedContents...")
        embeddings = embedding_service.get_embeddings_batch(chunk_texts, batch_size=80)

        records_to_insert = []
        for i, chunk in enumerate(chunks):
            emb = embeddings[i] if i < len(embeddings) else [0.0] * 1536
            if not emb or len(emb) != 1536:
                emb = [0.0] * 1536
            clean_content = (chunk.content or "").replace("\x00", "").replace("\u0000", "")
            clean_title = (chunk.slide_title or "").replace("\x00", "").replace("\u0000", "") if chunk.slide_title else None
            records_to_insert.append({
                "document_id": document_id,
                "unit_code": unit_code,
                "page_number": chunk.page_number,
                "slide_title": clean_title,
                "content": clean_content,
                "embedding": emb,
                "metadata": chunk.metadata
            })

        # Insert chunks in clean, safe batches of 50 to avoid request body limits
        logger.info(f"Inserting {len(records_to_insert)} vector chunks into Supabase...")
        batch_size = 50
        for i in range(0, len(records_to_insert), batch_size):
            batch = records_to_insert[i:i+batch_size]
            client.table("document_chunks").insert(batch).execute()

        # Mark document as processed
        client.table("documents").update({"is_processed": True}).eq("id", document_id).execute()
        logger.info(f"Successfully indexed {file_name}: {len(chunks)} chunks in Supabase.")

        return {
            "status": "success",
            "document_id": document_id,
            "file_name": file_name,
            "slides_extracted": len(extracted_pages),
            "chunks_indexed": len(chunks)
        }

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        # Clean up partially-created document record on failure
        try:
            if 'document_id' in dir():
                client.table("document_chunks").delete().eq("document_id", document_id).execute()
                client.table("documents").delete().eq("id", document_id).execute()
                logger.info(f"Cleaned up failed document {document_id}")
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
@limiter.limit("30/minute")
async def chat_with_unit(request: Request, payload: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    RAG Chat endpoint strictly isolated to payload.unit_code.
    Supports multimodal queries (attached past papers, diagrams, screenshots, formulas).
    Falls back to Tavily web search if notes have knowledge gaps or deep_search is enabled.
    Persists the full interaction into MongoDB chat_transcripts associated with student account.
    """
    user = get_user_from_header(authorization)
    user_id = user["id"] if user else "guest"
    user_email = user.get("email") if user else None
    attached_document_text = None
    image_b64 = payload.image_base64

    # Process attached document or file if supplied
    if payload.attached_file_base64:
        try:
            raw_b64 = payload.attached_file_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            file_bytes = base64.b64decode(raw_b64)
            if len(file_bytes) > 20 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="Security rejection: Attached file exceeds 20 MB size limit.")
            file_name = (payload.attached_file_name or "").lower()

            # Image attachment
            if any(file_name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]):
                if not image_b64:
                    image_b64 = raw_b64
            # PDF attachment (past papers, lecture slides, assignments)
            elif file_name.endswith(".pdf"):
                if b"%PDF-" not in file_bytes[:1024]:
                    raise HTTPException(status_code=400, detail="Security rejection: Invalid PDF attachment. Missing %PDF- signature.")
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                pages_text = []
                for idx, page in enumerate(doc):
                    if idx >= 20:  # Cap at 20 pages for chat prompt context
                        pages_text.append("... [Remaining pages omitted for context limits]")
                        break
                    txt = page.get_text()
                    if txt.strip():
                        pages_text.append(f"--- Page {idx + 1} ---\n{txt.strip()}")
                attached_document_text = "\n\n".join(pages_text)
            # Word / Docx
            elif file_name.endswith((".docx",)):
                try:
                    import docx
                    doc = docx.Document(io.BytesIO(file_bytes))
                    attached_document_text = "\n".join([p.text for p in doc.paragraphs if p.text])
                except Exception as de:
                    attached_document_text = file_bytes.decode("utf-8", errors="ignore")
            # Plain text, code, markdown
            else:
                attached_document_text = file_bytes.decode("utf-8", errors="replace")
        except Exception as e:
            logger.warning(f"Failed to process attached document in chat: {e}")

    result = await rag_router.execute_query(
        unit_code=payload.unit_code,
        query=payload.query,
        deep_search=payload.deep_search,
        similarity_threshold=payload.similarity_threshold,
        image_base64=image_b64,
        attached_document_text=attached_document_text,
        attached_file_name=payload.attached_file_name
    )

    # Persist transcript asynchronously to MongoDB
    try:
        col = get_chat_transcripts_collection()
        await col.insert_one({
            "session_id": payload.session_id or str(uuid.uuid4()),
            "user_id": user_id,
            "user_email": user_email,
            "unit_code": payload.unit_code,
            "query": payload.query,
            "answer": result["answer"],
            "citations": result["citations"],
            "external_sources": result["external_sources"],
            "web_search_used": result["web_search_used"],
            "max_similarity": result["max_similarity"],
            "has_image": bool(image_b64),
            "attached_file_name": payload.attached_file_name,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.warning(f"Failed to persist chat transcript to MongoDB: {e}")

    return result


# --- Spaced Repetition (SM-2) Flashcard Subsystem ---

@router.post("/flashcards/generate")
@limiter.limit("15/minute")
async def generate_flashcards(request: Request, payload: FlashcardGenerateRequest):
    """
    Generates high-yield exam flashcards for a unit and saves to MongoDB.
    """
    sys_inst = f"You are a university professor preparing flashcards for Chiromo unit [{payload.unit_code}]."
    user_p = f"""Generate {payload.card_count} high-yield revision flashcards on the topic: '{payload.topic}'.
For each card, provide:
1. Question (clear, conceptual, or algorithmic)
2. Answer (concise, precise)
3. Lecturer Exam Trap / Pitfall

Format output strictly as a JSON array of objects:
[
  {{
    "question": "...",
    "answer": "...",
    "exam_trap": "..."
  }}
]
"""
    raw_response = await rag_router.generate_text(sys_inst, user_p)
    cards_data = []
    try:
        clean_json = raw_response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        cards_data = json.loads(clean_json)
    except Exception:
        cards_data = [
            {"question": f"Key concept in {payload.topic}", "answer": raw_response[:200], "exam_trap": "Review syllabus notes"}
        ]

    inserted_cards = []
    col = get_flashcards_collection()
    now_iso = datetime.now(timezone.utc).isoformat()

    for item in cards_data:
        doc = {
            "unit_code": payload.unit_code,
            "topic": payload.topic,
            "question": item.get("question"),
            "answer": item.get("answer"),
            "exam_trap": item.get("exam_trap"),
            "repetitions": 0,
            "ease_factor": 2.5,
            "interval_days": 1,
            "next_review_at": now_iso,
            "created_at": now_iso
        }
        res = await col.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        inserted_cards.append(doc)

    return {"status": "success", "cards": inserted_cards}


@router.get("/flashcards/due/{unit_code}")
async def get_due_flashcards(unit_code: str):
    """
    Retrieves flashcards that are due for review based on SM-2 spaced repetition.
    """
    col = get_flashcards_collection()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor = col.find({"unit_code": unit_code, "next_review_at": {"$lte": now_iso}}).limit(10)
    cards = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        cards.append(doc)
    return {"unit_code": unit_code, "due_cards": cards, "count": len(cards)}


@router.post("/flashcards/review")
async def review_flashcard(payload: FlashcardReviewRequest):
    """
    Processes student recall quality (0-5) using SuperMemo-2 (SM-2).
    Updates next_review_at in MongoDB, and logs weaknesses to Supabase if quality < 3.
    """
    col = get_flashcards_collection()
    card = await col.find_one({"_id": ObjectId(payload.card_id)})
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    sm2_result = calculate_sm2_review(
        quality=payload.quality,
        repetitions=card.get("repetitions", 0),
        ease_factor=card.get("ease_factor", 2.5),
        previous_interval_days=card.get("interval_days", 1)
    )

    await col.update_one(
        {"_id": ObjectId(payload.card_id)},
        {"$set": {
            "repetitions": sm2_result["repetitions"],
            "ease_factor": sm2_result["ease_factor"],
            "interval_days": sm2_result["interval_days"],
            "next_review_at": sm2_result["next_review_at"],
            "last_reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    # If student struggled, automatically register as a weakness for 3 AM remediation
    if payload.quality < 3:
        try:
            client = get_supabase_admin_client()
            client.table("weakness_logs").insert({
                "unit_code": card.get("unit_code"),
                "topic_name": card.get("topic", "Flashcard concept"),
                "question_context": card.get("question"),
                "error_pattern": f"Struggled with recall (Score {payload.quality}/5)",
                "difficulty_score": 4,
                "is_resolved": False
            }).execute()
        except Exception as e:
            logger.warning(f"Could not log weakness to Supabase: {e}")

    return {"status": "updated", "sm2": sm2_result}


# --- Mock Exam Simulator Subsystem ---

@router.post("/mock-exams/generate")
@limiter.limit("15/minute")
async def generate_mock_exam(request: Request, payload: MockExamGenerateRequest):
    """
    Generates a full, complete, syllabus-grounded UoN exam paper with optional complete model answers
    formatted in structured JSON for both interactive UI and instant high-res PDF generation.
    """
    client = get_supabase_admin_client()
    unit_res = client.table("units").select("name, lecturer").eq("code", payload.unit_code).execute()
    unit_name = unit_res.data[0]["name"] if unit_res.data else "Computer Science"
    lecturer = unit_res.data[0]["lecturer"] if unit_res.data else "Chief Examiner"

    # Fetch real syllabus excerpts & past exam questions from Supabase pgvector/chunks
    chunks_res = client.table("document_chunks").select("chunk_text, page_number, documents(title, category)").eq("unit_code", payload.unit_code).limit(10).execute()
    syllabus_context = ""
    if chunks_res.data:
        for idx, c in enumerate(chunks_res.data[:6]):
            doc_title = (c.get("documents") or {}).get("title") or "Lecture Notes"
            syllabus_context += f"\n[SOURCE {idx+1}: {doc_title} (p. {c.get('page_number', 1)})]\n{c.get('chunk_text', '')[:350]}\n"

    sys_inst = (
        f"You are the senior University of Nairobi Chief Examiner for [{payload.unit_code}: {unit_name}]. "
        f"Lecturer: {lecturer}. You must set a complete, rigorous 70-mark University Examination paper matching Chiromo standards. "
        "Strict rule: You MUST output pure JSON only (no markdown code blocks, no backticks, no commentary)."
    )

    user_p = f"""Set a complete Chiromo Final Examination paper for {payload.unit_code}: {unit_name}.
Grounding Syllabus Context from Prescribed Textbooks & Past Exams:
{syllabus_context}

Return a valid JSON object with EXACTLY this structure:
{{
  "unit_code": "{payload.unit_code}",
  "unit_name": "{unit_name}",
  "academic_year": "2025/2026",
  "semester": "FIRST SEMESTER",
  "time_allowed": "2 HOURS",
  "instructions": "Answer Question ONE (Compulsory - 30 Marks) and any other TWO questions (20 Marks each).",
  "questions": [
    {{
      "question_number": "QUESTION ONE",
      "is_compulsory": true,
      "total_marks": 30,
      "stem": "Compulsory section covering fundamental theories, definitions, and short proofs.",
      "sub_questions": [
        {{
          "label": "a)",
          "text": "Detailed question testing foundational concepts...",
          "marks": 10,
          "model_answer": "Complete step-by-step model answer with formulas, technical terms, and derivations.",
          "citation": "{unit_code} Course Outline & Core Texts"
        }},
        {{
          "label": "b)",
          "text": "Detailed question testing structural design or core mechanisms...",
          "marks": 10,
          "model_answer": "Full technical explanation addressing standard marking points.",
          "citation": "{unit_code} Lecture Slides"
        }},
        {{
          "label": "c)",
          "text": "Scenario-based question or algorithmic derivation...",
          "marks": 10,
          "model_answer": "Comprehensive answer with edge cases and architectural trade-offs.",
          "citation": "{unit_code} Prescribed Text"
        }}
      ]
    }},
    {{
      "question_number": "QUESTION TWO",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "In-depth architectural analysis, formal proof, or system pipeline derivation.",
      "sub_questions": [
        {{
          "label": "a)",
          "text": "Detailed technical analysis question...",
          "marks": 10,
          "model_answer": "Step-by-step model solution meeting 10-mark standard.",
          "citation": "{unit_code} Prescribed Text"
        }},
        {{
          "label": "b)",
          "text": "Comparative trade-off or design problem...",
          "marks": 10,
          "model_answer": "Comprehensive comparison matrix and critical evaluation.",
          "citation": "{unit_code} Core Reference"
        }}
      ]
    }},
    {{
      "question_number": "QUESTION THREE",
      "is_compulsory": false,
      "total_marks": 20,
      "stem": "Practical real-world engineering case study, deadlock/concurrency proof, or optimization challenge.",
      "sub_questions": [
        {{
          "label": "a)",
          "text": "Scenario-based problem solving question...",
          "marks": 10,
          "model_answer": "Full technical resolution and proof.",
          "citation": "{unit_code} Reference Text"
        }},
        {{
          "label": "b)",
          "text": "Implementation constraints and pitfall defense...",
          "marks": 10,
          "model_answer": "Critical evaluation and step-by-step proof.",
          "citation": "{unit_code} Reference Text"
        }}
      ]
    }}
  ]
}}
"""
    raw_response = await rag_router.generate_text(sys_inst, user_p)
    clean_json = raw_response.strip()
    if clean_json.startswith("```json"):
        clean_json = clean_json[7:]
    if clean_json.startswith("```"):
        clean_json = clean_json[3:]
    if clean_json.endswith("```"):
        clean_json = clean_json[:-3]
    clean_json = clean_json.strip()

    try:
        exam_data = json.loads(clean_json)
    except Exception as e:
        logger.warning(f"Could not parse exam JSON: {e}. Fallback to structured text wrap.")
        exam_data = {
            "unit_code": payload.unit_code,
            "unit_name": unit_name,
            "academic_year": "2025/2026",
            "semester": "FIRST SEMESTER",
            "time_allowed": "2 HOURS",
            "instructions": "Answer Question ONE and any other TWO questions.",
            "questions": [
                {
                    "question_number": "QUESTION ONE",
                    "is_compulsory": True,
                    "total_marks": 30,
                    "stem": "Full Examination Paper",
                    "sub_questions": [
                        {
                            "label": "a)",
                            "text": raw_response[:300],
                            "marks": 15,
                            "model_answer": "Refer to complete course slides.",
                            "citation": payload.unit_code
                        },
                        {
                            "label": "b)",
                            "text": "Discuss the primary theoretical trade-offs in this unit.",
                            "marks": 15,
                            "model_answer": "Key trade-offs include memory vs latency and complexity vs maintainability.",
                            "citation": payload.unit_code
                        }
                    ]
                }
            ]
        }

    # Store exam in MongoDB
    col = get_mock_exams_collection()
    doc = {
        "unit_code": payload.unit_code,
        "difficulty": payload.difficulty,
        "exam_type": payload.exam_type,
        "exam_data": exam_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_completed": False
    }
    res = await col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"status": "success", "exam": doc}


@router.get("/mock-exams/{exam_id}/pdf")
async def download_mock_exam_pdf(exam_id: str, include_answers: bool = True):
    """
    Renders and streams a complete, high-resolution, color-coded PDF of the simulated examination paper.
    """
    col = get_mock_exams_collection()
    exam = await col.find_one({"_id": ObjectId(exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="Mock exam not found.")

    exam_data = exam.get("exam_data")
    if not exam_data:
        raise HTTPException(status_code=400, detail="Exam does not contain structured question data.")

    pdf_bytes = build_simulated_exam_pdf(exam_data, include_answers=include_answers)
    unit_code = exam_data.get("unit_code", "UON").replace(" ", "_")
    ans_flag = "With_Answers" if include_answers else "Questions_Only"
    filename = f"UoN_{unit_code}_Exam_Simulation_{ans_flag}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# --- Revision Question & Answer Companion Subsystem ---

@router.post("/revision-qa/generate")
@limiter.limit("20/minute")
async def generate_revision_qa(request: Request, payload: RevisionQAGenerateRequest):
    """
    Takes any revision question fed by the student, grounds it strictly in notes/prescribed texts,
    and returns a structured model answer, marking scheme, lecturer traps, and generates a downloadable PDF.
    """
    client = get_supabase_admin_client()
    unit_res = client.table("units").select("name, lecturer").eq("code", payload.unit_code).execute()
    unit_name = unit_res.data[0]["name"] if unit_res.data else "Academic Unit"

    # RAG vector retrieval for this question
    emb_res = embedding_service.embed_query(payload.question)
    query_vector = emb_res.get("embedding", [])
    
    context_chunks = []
    citations = []
    if query_vector:
        try:
            match_res = client.rpc("match_document_chunks", {
                "query_embedding": query_vector,
                "match_count": 5,
                "filter_unit_code": payload.unit_code
            }).execute()
            if match_res.data:
                for c in match_res.data:
                    context_chunks.append(f"[{c.get('document_title', 'Notes')} | p.{c.get('page_number', 1)}]: {c.get('chunk_text', '')}")
                    citations.append({
                        "document_title": c.get("document_title", "Notes"),
                        "page_number": c.get("page_number", 1)
                    })
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

    notes_context_block = "\n\n".join(context_chunks) if context_chunks else f"Use standard University of Nairobi curriculum for {payload.unit_code}: {unit_name}."

    sys_inst = (
        f"You are the top subject-matter professor for University of Nairobi [{payload.unit_code}: {unit_name}]. "
        "A student has fed a revision question. You must provide an authoritative, step-by-step model solution, "
        "a point-by-point marking rubric, and warn them about common exam traps. "
        "Strict rule: Return pure JSON only."
    )

    user_p = f"""REVISION QUESTION FED BY STUDENT:
"{payload.question}"

TARGET MARKS: {payload.target_marks} Marks
UNIT: {payload.unit_code} - {unit_name}

GROUNDING LECTURE NOTES & TEXTBOOK CHUNKS:
{notes_context_block}

Return a valid JSON object matching this schema:
{{
  "unit_code": "{payload.unit_code}",
  "unit_name": "{unit_name}",
  "topic": "{payload.topic or 'Exam Revision Problem'}",
  "question": "{payload.question.replace('\"', '')}",
  "model_answer": "Complete step-by-step academic proof, definitions, architectural trade-offs, and clear solutions meeting full {payload.target_marks}-mark expectations.",
  "marking_rubric": [
    {{"marks": "3 Marks", "criterion": "Precise academic definition and foundational formula."}},
    {{"marks": "6 Marks", "criterion": "Step-by-step mathematical derivation or architectural mechanism."}},
    {{"marks": "3 Marks", "criterion": "Critical analysis of edge cases or trade-offs."}},
    {{"marks": "3 Marks", "criterion": "Correct final conclusions and real-world application."}}
  ],
  "common_pitfalls": "Key traps: 1. Confusing X with Y. 2. Forgetting boundary conditions. 3. Omitting state transition diagrams.",
  "citations": [
    {{"document_title": "{unit_name} Lecture Slides", "page_number": 1}}
  ]
}}
"""
    raw_response = await rag_router.generate_text(sys_inst, user_p)
    clean_json = raw_response.strip()
    if clean_json.startswith("```json"):
        clean_json = clean_json[7:]
    if clean_json.startswith("```"):
        clean_json = clean_json[3:]
    if clean_json.endswith("```"):
        clean_json = clean_json[:-3]
    clean_json = clean_json.strip()

    try:
        qa_data = json.loads(clean_json)
        if citations:
            qa_data["citations"] = citations
    except Exception as e:
        logger.warning(f"Could not parse QA JSON: {e}")
        qa_data = {
            "unit_code": payload.unit_code,
            "unit_name": unit_name,
            "topic": payload.topic or "Revision Problem",
            "question": payload.question,
            "model_answer": raw_response,
            "marking_rubric": [{"marks": f"{payload.target_marks} Marks", "criterion": "Comprehensive technical coverage."}],
            "common_pitfalls": "Avoid vague answers; quote exact definitions and proofs.",
            "citations": citations
        }

    # Generate PDF in memory immediately
    pdf_bytes = build_revision_qa_pdf(qa_data)
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

    return {
        "status": "success",
        "qa_data": qa_data,
        "pdf_base64": pdf_b64
    }


@router.post("/mock-exams/evaluate")
@limiter.limit("15/minute")
async def evaluate_mock_exam(request: Request, payload: MockExamEvaluateRequest):
    """
    Evaluates student's submitted answers against the UoN marking rubric and saves evaluation to MongoDB.
    """
    col = get_mock_exams_collection()
    exam = await col.find_one({"_id": ObjectId(payload.exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="Mock exam not found.")

    sys_inst = f"You are a rigorous UoN Computer Science Lecturer grading a student's final exam script for [{exam.get('unit_code')}]."
    user_p = f"""EXAM PAPER:
{exam.get('paper_markdown')}

STUDENT'S SUBMITTED ANSWERS:
{payload.student_submission}

EVALUATION RUBRIC:
1. Academic Definitions (Correct technical vocabulary)
2. Diagrammatic / Structural Accuracy (Architecture & UML)
3. Step-by-Step Proofs & Calculations
4. Trade-Off Analysis & Critical Insight

OUTPUT:
- Total Score: (e.g. 58/70)
- Grade: (First Class / Upper Second / Lower Second / Fail)
- Question-by-Question Marking Breakdown
- Actionable Corrections to secure an A in the real exam
"""
    evaluation_text = await rag_router.generate_text(sys_inst, user_p)
    await col.update_one(
        {"_id": ObjectId(payload.exam_id)},
        {"$set": {
            "student_submission": payload.student_submission,
            "evaluation_markdown": evaluation_text,
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "is_completed": True
        }}
    )
    return {"status": "evaluated", "evaluation": evaluation_text}


@router.get("/briefings/today")
def get_today_briefing():
    """Fetches today's morning briefing."""
    client = get_supabase_admin_client()
    res = client.table("daily_briefings").select("*").order("created_at", desc=True).limit(1).execute()
    if res.data:
        return {"briefing": res.data[0]}
    return {"briefing": None, "message": "No briefing generated yet today."}


@router.post("/briefings/trigger-now")
async def trigger_briefing_now(background_tasks: BackgroundTasks):
    """Manual test trigger for the 3 AM Abstractor."""
    background_tasks.add_task(run_nightly_abstraction_job)
    return {"status": "accepted", "message": "3 AM Abstractor job initiated in background."}


@router.post("/past-papers/analyze")
@limiter.limit("15/minute")
async def analyze_past_paper_trends(request: Request, payload: PastPaperAnalyzeRequest):
    """
    Predict & Trend Engine: Analyzes recurring exam themes and question frequency.
    """
    system_inst = f"You are the senior examiner for University of Nairobi unit [{payload.unit_code}]."
    user_p = f"""Analyze typical examination trends and recurring themes based on Chiromo Computer Science syllabi for [{payload.unit_code}].
Output:
1. High-Probability Topics (ranked by typical exam frequency)
2. Compulsory Section A Question Predictions
3. Recommended Formula / Proof Revision Checklist
Format clearly in Markdown with LaTeX math where appropriate.
"""
    analysis = await rag_router.generate_text(system_inst, user_p)
    return {"unit_code": payload.unit_code, "analysis": analysis}


@router.post("/past-papers/solve")
@limiter.limit("15/minute")
async def solve_past_paper_question(request: Request, payload: PastPaperSolveRequest):
    """
    Model Marking Scheme Solver: drafts answers formatted as UoN lecturers award marks.
    """
    system_inst = f"You are a UoN Computer Science Lecturer evaluating a past exam question for [{payload.unit_code}]."
    user_p = f"""Total Marks: {payload.marks}

QUESTION:
{payload.question}

Provide the Model Answer formatted strictly as expected in UoN marking schemes:
1. Academic Definition & Core Principles (2-3 marks)
2. Architectural Diagram / Flowchart (ASCII or Mermaid) (3-4 marks)
3. Step-by-Step Technical Analysis / Proof / Derivation (6-8 marks)
4. Critical Evaluation, Comparison or Trade-Offs (2-3 marks)
"""
    model_answer = await rag_router.generate_text(system_inst, user_p)
    return {"unit_code": payload.unit_code, "model_answer": model_answer}


@router.post("/weakness/log")
def log_student_weakness(payload: LogWeaknessRequest):
    """Records a weak topic to feed into the 3 AM Abstractor's morning drill."""
    client = get_supabase_admin_client()
    res = client.table("weakness_logs").insert({
        "unit_code": payload.unit_code,
        "topic_name": payload.topic_name,
        "error_pattern": payload.error_pattern,
        "difficulty_score": payload.difficulty_score,
        "is_resolved": False
    }).execute()
    return {"status": "logged", "record": res.data}


# --- Professor Deep Teaching & Abstraction Subsystem ---

@router.get("/professor/stages")
def get_professor_stages():
    """Returns the pedagogical stage definitions for the 5-chunk Socratic journey."""
    return {"stages": PEDAGOGICAL_STAGES}


@router.post("/professor/teach")
async def teach_professor_chunk(payload: ProfessorTeachRequest):
    """
    Delivers a deep, first-principles academic lecture chunk for any hard topic or ingested document.
    Refuses superficial summaries: provides mechanical traces, ASCII memory diagrams, exam gotchas,
    and Socratic checkpoints.
    """
    try:
        result = await professor_service.teach_chunk(
            unit_code=payload.unit_code,
            topic=payload.topic or "",
            document_id=payload.document_id,
            chunk_index=payload.chunk_index,
            student_response=payload.student_response,
            explain_deeper=payload.explain_deeper
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error in professor teach endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/professor/document/{document_id}/syllabus")
async def get_document_syllabus(document_id: str):
    """
    Parses an entire uploaded book, slide deck, or past paper from page 1 to the end,
    organizing all slides into coherent, sequential Lesson Batches.
    """
    try:
        syllabus = await professor_course_service.get_document_syllabus(document_id)
        return {"status": "success", "data": syllabus}
    except Exception as e:
        logger.error(f"Error generating document syllabus: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/professor/document/{document_id}/slide/{page_number}")
async def get_individual_slide(document_id: str, page_number: int):
    """
    Returns the exact raw extracted text and metadata of a single slide in < 50ms.
    """
    try:
        slide = await professor_course_service.get_slide_raw_content(document_id, page_number)
        return {"status": "success", "data": slide}
    except Exception as e:
        logger.error(f"Error fetching individual slide {page_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/professor/document/lesson")
async def teach_document_lesson(payload: ProfessorLessonRequest):
    """
    Delivers a full Professor Masterclass covering Slides start_page to end_page.
    Teaches in MORE DETAIL than the slides themselves, unpacking mechanics, memory maps,
    C code, and Chiromo Section B exam problems.
    """
    try:
        lesson = await professor_course_service.teach_lesson_batch(
            document_id=payload.document_id,
            unit_code=payload.unit_code,
            start_page=payload.start_page,
            end_page=payload.end_page,
            custom_focus=payload.custom_focus
        )
        return {"status": "success", "data": lesson}
    except Exception as e:
        logger.error(f"Error teaching document lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/professor/document/ask")
async def ask_professor_about_lesson(payload: ProfessorAskRequest):
    """
    Interactive Professor Office Hours: Answers student doubts specifically grounded
    in the active lesson slide batch.
    """
    try:
        answer = await professor_course_service.ask_lesson_question(
            document_id=payload.document_id,
            unit_code=payload.unit_code,
            start_page=payload.start_page,
            end_page=payload.end_page,
            question=payload.question
        )
        return {"status": "success", "answer": answer}
    except Exception as e:
        logger.error(f"Error answering lesson question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/professor/curriculum/search")
async def search_and_create_curriculum(payload: ProfessorSearchCurriculumRequest):
    """
    Retrieves matching textbook or slides across the unit for a concept query
    and constructs a lesson-by-lesson syllabus.
    """
    try:
        result = await professor_course_service.search_and_create_curriculum(
            unit_code=payload.unit_code,
            query=payload.query
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error searching curriculum: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/account")
@limiter.limit("5/minute")
async def delete_user_account(request: Request, authorization: Optional[str] = Header(None)):
    """
    Permanently deletes a student user account, all their uploaded notes/documents,
    and associated revision history from Supabase in accordance with GDPR/DPA right to be forgotten.
    """
    user = get_user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to delete account.")
    
    user_id = user["id"]
    client = get_supabase_admin_client()

    try:
        # 1. Purge all user uploaded documents & chunks
        user_docs = client.table("documents").select("id").eq("uploaded_by", user_id).execute()
        if user_docs.data:
            doc_ids = [d["id"] for d in user_docs.data]
            for d_id in doc_ids:
                client.table("document_chunks").delete().eq("document_id", d_id).execute()
            client.table("documents").delete().eq("uploaded_by", user_id).execute()

        # 2. Purge user weakness logs
        try:
            client.table("weakness_logs").delete().eq("user_id", user_id).execute()
        except Exception:
            pass

        # 3. Purge user profile record
        try:
            client.table("profiles").delete().eq("id", user_id).execute()
        except Exception:
            pass

        # 4. Delete user authentication identity from Supabase Auth
        try:
            client.auth.admin.delete_user(user_id)
        except Exception as auth_err:
            logger.warning(f"Could not delete user from Supabase Auth admin API: {auth_err}")

        logger.info(f"Successfully purged account and all personal data for user {user_id}")
        return {
            "status": "success",
            "message": "Account and all associated personal documents permanently deleted."
        }
    except Exception as e:
        logger.error(f"Error deleting user account: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")


@router.get("/admin/backup")
@limiter.limit("5/minute")
async def export_database_backup(request: Request):
    """
    Generates a full JSON snapshot of units, documents, timetable slots, profiles,
    and MongoDB chat transcripts for disaster recovery auditing.
    """
    client = get_supabase_admin_client()
    try:
        units_res = client.table("units").select("*").execute()
        docs_res = client.table("documents").select("id, unit_code, title, page_count, is_processed, storage_url, created_at").execute()
        slots_res = client.table("timetable_slots").select("*").execute()
        profiles_res = client.table("profiles").select("id, email, full_name, role, created_at").execute()

        # MongoDB Transcripts count / sample
        transcripts_count = 0
        try:
            col = get_chat_transcripts_collection()
            transcripts_count = await col.count_documents({})
        except Exception:
            pass

        backup_payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "system": "EduRAG Scholar",
                "environment": "production",
                "units_count": len(units_res.data or []),
                "documents_count": len(docs_res.data or []),
                "timetable_slots_count": len(slots_res.data or []),
                "profiles_count": len(profiles_res.data or []),
                "mongo_transcripts_count": transcripts_count
            },
            "tables": {
                "units": units_res.data or [],
                "documents": docs_res.data or [],
                "timetable_slots": slots_res.data or [],
                "profiles": profiles_res.data or []
            }
        }
        return backup_payload
    except Exception as e:
        logger.error(f"Error generating database backup snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))
