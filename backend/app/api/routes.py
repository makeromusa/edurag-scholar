import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_supabase_admin_client
from app.core.mongodb import (
    get_chat_transcripts_collection,
    get_mock_exams_collection,
    get_flashcards_collection,
    get_briefing_archives_collection
)
from app.services.spaced_repetition import calculate_sm2_review
from app.ingestion.extractor import extract_document_pages
from app.ingestion.chunker import chunk_extracted_pages
from app.ingestion.embedder import embedding_service
from app.agents.rag_router import rag_router
from app.workers.abstractor import run_nightly_abstraction_job

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Pydantic Schemas ---
class ChatRequest(BaseModel):
    unit_code: str
    query: str
    session_id: Optional[str] = None
    deep_search: bool = False
    similarity_threshold: float = 0.68


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


class MockExamEvaluateRequest(BaseModel):
    exam_id: str
    student_submission: str


class LogWeaknessRequest(BaseModel):
    user_id: Optional[str] = None
    unit_code: str
    topic_name: str
    error_pattern: Optional[str] = None
    difficulty_score: int = 3


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


@router.post("/documents/upload")
async def upload_document(
    unit_code: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Ingests and processes a course document (PDF slides, PPTX, DOCX, past paper).
    Extracts text/slides, creates chunks, computes embeddings, and stores in Supabase.
    """
    client = get_supabase_admin_client()
    file_bytes = await file.read()
    file_name = file.filename or "unknown_doc"
    file_type = "pdf" if file_name.endswith(".pdf") else "pptx" if file_name.endswith(".pptx") else "docx"

    try:
        # 1. Extract pages/slides
        extracted_pages = extract_document_pages(file_bytes, file_name)
        if not extracted_pages:
            raise HTTPException(status_code=400, detail="No extractable text found in file.")

        # 2. Register document in Supabase
        doc_res = client.table("documents").insert({
            "unit_code": unit_code,
            "title": file_name,
            "file_type": file_type,
            "storage_url": f"local://{file_name}",
            "file_size_bytes": len(file_bytes),
            "page_count": len(extracted_pages),
            "is_processed": False
        }).execute()
        
        doc_record = doc_res.data[0]
        document_id = doc_record["id"]

        # 3. Slide-aware Chunking
        chunks = chunk_extracted_pages(extracted_pages, unit_code=unit_code, document_id=document_id)

        # 4. Generate Embeddings & Insert
        chunk_texts = [c.content for c in chunks]
        embeddings = embedding_service.get_embeddings_batch(chunk_texts)

        records_to_insert = []
        for i, chunk in enumerate(chunks):
            records_to_insert.append({
                "document_id": document_id,
                "unit_code": unit_code,
                "page_number": chunk.page_number,
                "slide_title": chunk.slide_title,
                "content": chunk.content,
                "embedding": embeddings[i],
                "metadata": chunk.metadata
            })

        # Insert chunks in batches of 50
        batch_size = 50
        for i in range(0, len(records_to_insert), batch_size):
            batch = records_to_insert[i:i+batch_size]
            client.table("document_chunks").insert(batch).execute()

        # Mark document as processed
        client.table("documents").update({"is_processed": True}).eq("id", document_id).execute()

        return {
            "status": "success",
            "document_id": document_id,
            "file_name": file_name,
            "slides_extracted": len(extracted_pages),
            "chunks_indexed": len(chunks)
        }

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_unit(payload: ChatRequest):
    """
    RAG Chat endpoint strictly isolated to payload.unit_code.
    Falls back to Tavily web search if notes have knowledge gaps or deep_search is enabled.
    Persists the full interaction into MongoDB chat_transcripts.
    """
    result = await rag_router.execute_query(
        unit_code=payload.unit_code,
        query=payload.query,
        deep_search=payload.deep_search,
        similarity_threshold=payload.similarity_threshold
    )

    # Persist transcript asynchronously to MongoDB
    try:
        col = get_chat_transcripts_collection()
        await col.insert_one({
            "session_id": payload.session_id or str(uuid.uuid4()),
            "unit_code": payload.unit_code,
            "query": payload.query,
            "answer": result["answer"],
            "citations": result["citations"],
            "external_sources": result["external_sources"],
            "web_search_used": result["web_search_used"],
            "max_similarity": result["max_similarity"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.warning(f"Failed to persist chat transcript to MongoDB: {e}")

    return result


# --- Spaced Repetition (SM-2) Flashcard Subsystem ---

@router.post("/flashcards/generate")
async def generate_flashcards(payload: FlashcardGenerateRequest):
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
async def generate_mock_exam(payload: MockExamGenerateRequest):
    """
    Generates a timed 3-question UoN exam paper and stores it in MongoDB.
    """
    sys_inst = f"You are the chief examiner setting the final examination for UoN Chiromo unit [{payload.unit_code}]."
    user_p = f"""Set a full, rigorous examination paper for [{payload.unit_code}] matching UoN standards.
Structure:
- Question 1 (Compulsory - 30 Marks): 3 sub-questions on core fundamental theory and definitions.
- Question 2 (20 Marks): Architectural analysis, derivation, or pipeline design.
- Question 3 (20 Marks): Scenario-based trade-offs, deadlock analysis, or algorithm implementation.

Output clearly in Markdown with total marks and mark allocations per sub-part.
"""
    paper_text = await rag_router.generate_text(sys_inst, user_p)
    col = get_mock_exams_collection()
    doc = {
        "unit_code": payload.unit_code,
        "difficulty": payload.difficulty,
        "paper_markdown": paper_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_completed": False
    }
    res = await col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"status": "success", "exam": doc}


@router.post("/mock-exams/evaluate")
async def evaluate_mock_exam(payload: MockExamEvaluateRequest):
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
async def analyze_past_paper_trends(payload: PastPaperAnalyzeRequest):
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
async def solve_past_paper_question(payload: PastPaperSolveRequest):
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
