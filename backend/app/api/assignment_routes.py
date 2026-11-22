"""
Assignment & Architecture Studio Routes — EduRAG Scholar
Autonomous, syllabus-grounded assignment solver, technical diagram synthesizer,
and publication-grade PDF/DOCX exporter.
"""
import base64
import logging
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Response, Header
from pydantic import BaseModel

from app.core.database import match_unit_chunks_rpc, get_supabase_admin_client
from app.agents.rag_router import rag_router
from app.core.assignment_exporter import build_assignment_pdf, build_assignment_docx
from app.ingestion.embedder import embedding_service

logger = logging.getLogger("edurag.assignments")
assignment_router = APIRouter(prefix="/assignments", tags=["assignments"])


class AssignmentSolveRequest(BaseModel):
    unit_code: str
    prompt: str
    target_marks: Optional[int] = 15
    diagram_preference: Optional[str] = "auto"   # "auto" | "dfd" | "erd" | "uml" | "architecture" | "flowchart" | "none"
    notation_style: Optional[str] = "standard"   # "standard" | "gane_sarson" | "yourdon"
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = None


class AssignmentExportRequest(BaseModel):
    unit_code: str
    unit_name: Optional[str] = ""
    title: Optional[str] = None
    question: Optional[str] = ""
    solution_markdown: str
    target_marks: Optional[int] = None
    student_name: Optional[str] = None  # None by default per user requirement


def _extract_mermaid_blocks(text: str) -> List[str]:
    """Finds all ```mermaid ... ``` code blocks in markdown text."""
    pattern = r"```(?:mermaid)?\s*([\s\S]*?)```"
    matches = re.findall(pattern, text, re.IGNORECASE)
    valid_blocks = []
    for m in matches:
        trimmed = m.strip()
        first_word = trimmed.split()[0].lower() if trimmed.split() else ""
        if first_word in (
            "graph", "flowchart", "sequencediagram", "classdiagram",
            "erdiagram", "statediagram", "gantt", "pie", "gitgraph"
        ):
            valid_blocks.append(trimmed)
    return valid_blocks


@assignment_router.post("/solve")
async def solve_assignment(payload: AssignmentSolveRequest, authorization: Optional[str] = Header(None)):
    """
    Synthesizes a complete, syllabus-grounded assignment solution with
    technical diagrams (Mermaid.js) and viva defense prep.
    Anonymous by default: never includes student name.
    """
    from app.api.routes import get_user_from_header
    user = get_user_from_header(authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to solve assignments. Please sign in."
        )
    if not (payload.prompt or "").strip() and not payload.file_base64:
        raise HTTPException(status_code=400, detail="Assignment prompt or question document is required.")

    # 1. Syllabus retrieval (Vector similarity + Keyword fallback)
    unit_code = payload.unit_code.upper()
    retrieved_chunks = []
    try:
        query_vector = embedding_service.get_embedding(payload.prompt or unit_code)
        if query_vector and any(v != 0.0 for v in query_vector):
            retrieved_chunks = await match_unit_chunks_rpc(
                unit_code=unit_code,
                query_embedding=query_vector,
                match_threshold=0.60,
                match_count=6
            )
    except Exception as e:
        logger.warning(f"Could not retrieve vector chunks for {unit_code}: {e}")

    # Fallback to keyword matching if 0 chunks found
    if not retrieved_chunks and payload.prompt:
        try:
            client = get_supabase_admin_client()
            terms = [w.strip() for w in payload.prompt.replace("?", "").replace(",", "").replace(".", "").split() if len(w) > 3][:3]
            for term in terms:
                kw_res = client.table("document_chunks").select("id, unit_code, document_id, page_number, slide_title, content, metadata").eq("unit_code", unit_code).ilike("content", f"%{term}%").limit(6).execute()
                if kw_res.data:
                    retrieved_chunks = kw_res.data
                    logger.info(f"Retrieved {len(retrieved_chunks)} assignment reference chunks via keyword match on '{term}'")
                    break
        except Exception as e:
            logger.warning(f"Keyword search fallback error in assignment solver: {e}")

    context_str = ""
    citations = []
    if retrieved_chunks:
        context_parts = []
        for i, c in enumerate(retrieved_chunks):
            doc_title = c.get("file_name") or c.get("title") or "Course Material"
            page_num = c.get("page_number", 1)
            content = c.get("content", "")
            context_parts.append(f"[Excerpt {i+1} | Source: {doc_title}, Page {page_num}]:\n{content}")
            citations.append({"document_title": doc_title, "page_number": page_num})
        context_str = "\n\n".join(context_parts)
    else:
        context_str = f"Rely on established computer science, engineering, and mathematics definitions prescribed for {unit_code}."

    # Live academic web search enhancement (Tavily)
    external_sources = []
    if rag_router.tavily_client and payload.prompt:
        try:
            search_query = f"{payload.prompt[:160]} {unit_code} academic computer science engineering"
            search_res = rag_router.tavily_client.search(
                query=search_query,
                search_depth="advanced",
                max_results=3,
                include_domains=[
                    "geeksforgeeks.org", "wikipedia.org", "tutorialspoint.com",
                    "arxiv.org", "mit.edu", "stanford.edu", "github.com", "baeldung.com"
                ]
            )
            raw_web = search_res.get("results", [])
            if raw_web:
                web_parts = []
                for w in raw_web:
                    external_sources.append({"title": w.get("title", "Web Source"), "url": w.get("url", "#")})
                    web_parts.append(f"[External Academic Excerpt | {w.get('title')}]:\n{w.get('content')}")
                context_str += "\n\n--- LIVE ACADEMIC WEB SOURCES (TAVILY) ---\n" + "\n\n".join(web_parts)
                logger.info(f"Assignment Studio incorporated {len(raw_web)} live web search results.")
        except Exception as web_err:
            logger.warning(f"Assignment Studio web search warning: {web_err}")

    # 2. Build multi-stage prompt
    notation_guide = ""
    if payload.notation_style == "gane_sarson":
        notation_guide = "- For Data Flow Diagrams (DFD), strictly utilize Gane & Sarson notation (rounded process boxes, open-ended rectangles for data stores)."
    elif payload.notation_style == "yourdon":
        notation_guide = "- For Data Flow Diagrams (DFD), strictly utilize Yourdon & DeMarco notation (circular processes, parallel line data stores)."

    marks_depth_guide = f"- Depth & Rigor: Tailor the completeness to an examiner's grading rubric for **{payload.target_marks} Marks**."

    sys_instruction = f"""You are a distinguished University Professor and Technical Systems Architect for course unit [{unit_code}].
Your objective is to generate an exemplary, highest-distinction academic solution for the student's assignment question.

CORE ACADEMIC PRINCIPLES:
1. SYLLABUS GROUNDING: Ground your reasoning, definitions, formulas, and terminology in the provided lecture slide excerpts.
2. ANONYMITY: Do NOT include or assume any student name, student ID, or personal references unless explicitly asked in the prompt. Produce an objective, clean academic paper.
3. DIAGRAMS: Whenever the problem benefits from or requests architecture, DFDs, ERDs, UML, or process flowcharts, output an executable, syntactically clean ```mermaid block.
{notation_guide}
{marks_depth_guide}
4. EQUATIONS & CALCULATIONS: Format all mathematical formulations, memory addresses, and proofs in LaTeX KaTeX ($...$ or $$...$$).
5. STRUCTURE:
   - ## Theoretical Foundation & Problem Overview
   - ## Step-by-Step Derivation & Technical Architecture
   - ## Technical Diagram (if applicable, in valid ```mermaid syntax)
   - ## Examiner Model Criteria & Technical Pitfalls
"""

    user_query = f"""--- PRESCRIBED LECTURE SLIDE EXCERPTS ---
{context_str}

--- ASSIGNMENT QUESTION ---
{payload.prompt}
"""

    # If chat history is provided, append past context
    if payload.chat_history:
        history_summary = "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in payload.chat_history[-4:]])
        user_query = f"--- PREVIOUS REFINEMENTS ---\n{history_summary}\n\n{user_query}"

    # 3. Model Generation
    raw_response = ""
    try:
        if payload.file_base64 and payload.file_type and payload.file_type.startswith("image/"):
            raw_response = await rag_router.generate_multimodal(
                sys_instruction,
                user_query,
                payload.file_base64,
                payload.file_type
            )
        else:
            raw_response = await rag_router.generate_text(sys_instruction, user_query)
    except Exception as e:
        logger.error(f"Assignment generation error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM Synthesis failed: {str(e)}")

    # 4. Extract Mermaid diagrams
    mermaid_blocks = _extract_mermaid_blocks(raw_response)
    primary_diagram = mermaid_blocks[0] if mermaid_blocks else None

    # 5. Extract viva defense questions
    viva_questions = [
        f"Explain how your proposed architecture ensures fault tolerance and data integrity in {unit_code}.",
        f"What trade-offs exist between your chosen methodology and alternative approaches in the syllabus?",
        f"Walk through step 2 of your derivation and defend the assumptions made."
    ]

    return {
        "unit_code": unit_code,
        "target_marks": payload.target_marks,
        "solution_markdown": raw_response,
        "mermaid_code": primary_diagram,
        "all_diagrams": mermaid_blocks,
        "citations": citations,
        "external_sources": external_sources,
        "viva_questions": viva_questions,
    }


@assignment_router.post("/export-pdf")
async def export_assignment_pdf(payload: AssignmentExportRequest):
    """Generates a publication-grade academic PDF (Anonymous by default)."""
    try:
        pdf_bytes = build_assignment_pdf(payload.dict())
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{payload.unit_code}_Assignment_Solution.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"PDF export error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@assignment_router.post("/export-docx")
async def export_assignment_docx(payload: AssignmentExportRequest):
    """Generates a formatted Microsoft Word (.docx) document (Anonymous by default)."""
    try:
        docx_bytes = build_assignment_docx(payload.dict())
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{payload.unit_code}_Assignment_Solution.docx"'
            }
        )
    except Exception as e:
        logger.error(f"DOCX export error: {e}")
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")
