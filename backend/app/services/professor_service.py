import json
import logging
from typing import Dict, Any, List, Optional
from app.core.database import get_supabase_admin_client, match_unit_chunks_rpc
from app.agents.rag_router import rag_router
from app.ingestion.embedder import embedding_service

logger = logging.getLogger(__name__)

PEDAGOGICAL_STAGES = [
    {
        "index": 0,
        "stage_name": "The Architectural Dilemma & First Principles",
        "objective": "Explain the fundamental problem that forced computer scientists or mathematicians to invent this concept. Why do naive solutions fail? What is the core trade-off?",
    },
    {
        "index": 1,
        "stage_name": "The Core Abstraction & Mental Model",
        "objective": "Deconstruct the deep mental model and high-level invariants. Give a crystal-clear architectural metaphor and explain the indirection layer without superficial hand-waving.",
    },
    {
        "index": 2,
        "stage_name": "Mechanical Step-by-Step Trace & Architecture",
        "objective": "Provide a rigorous step-by-step mechanical trace. Include ASCII memory maps, register/state transition tables, or mathematical derivations. Show the exact bitwise or algorithmic execution flow.",
    },
    {
        "index": 3,
        "stage_name": "Lecturer Exam Traps & Chiromo Edge Cases",
        "objective": "Expose the subtle pitfalls, tricky edge cases, and calculation gotchas that university lecturers test in exam questions. Contrast common student misconceptions with rigorous truth.",
    },
    {
        "index": 4,
        "stage_name": "Socratic Checkpoint & Active Mastery Drill",
        "objective": "Challenge the student with an active-recall scenario question requiring first-principles reasoning. Guide them through synthesizing the complete topic.",
    }
]


class ProfessorService:
    def __init__(self):
        pass

    async def _fetch_context(self, unit_code: str, topic: Optional[str], document_id: Optional[str]) -> tuple[str, List[Dict[str, Any]], str]:
        """Retrieves verified document text chunks from Supabase."""
        client = get_supabase_admin_client()
        context_chunks: List[Dict[str, Any]] = []
        doc_title = ""

        # 1. If specific document is provided, fetch its chunks directly
        if document_id:
            try:
                doc_meta = client.table("documents").select("title").eq("id", document_id).execute()
                if doc_meta.data:
                    doc_title = doc_meta.data[0].get("title", "")

                chunks_res = client.table("document_chunks").select("id, page_number, slide_title, content, metadata").eq("document_id", document_id).order("page_number").limit(15).execute()
                if chunks_res.data:
                    context_chunks = chunks_res.data
            except Exception as e:
                logger.warning(f"Error fetching document chunks for {document_id}: {e}")

        # 2. If topic is provided or document has few chunks, search vector store using match_unit_chunks_rpc
        if not context_chunks and topic:
            try:
                query_vec = embedding_service.get_embedding(f"{unit_code} {topic}")
                matches = await match_unit_chunks_rpc(
                    unit_code=unit_code,
                    query_embedding=query_vec,
                    match_threshold=0.60,
                    match_count=8
                )
                if matches:
                    context_chunks = matches
            except Exception as e:
                logger.warning(f"Vector search failed in professor service: {e}")

        # 3. Fallback: Keyword search in unit chunks
        if not context_chunks and topic:
            try:
                words = [w for w in topic.split() if len(w) > 3][:3]
                for w in words:
                    res = client.table("document_chunks").select("id, page_number, slide_title, content, metadata").eq("unit_code", unit_code).ilike("content", f"%{w}%").limit(6).execute()
                    if res.data:
                        context_chunks = res.data
                        break
            except Exception as e:
                logger.warning(f"Keyword search failed in professor service: {e}")

        # Compile formatted context
        context_text_blocks = []
        for c in context_chunks:
            p_num = c.get("page_number", 1)
            title = c.get("slide_title") or doc_title or "Lecture Notes"
            content = c.get("content", "").strip()
            context_text_blocks.append(f"[{title} | Page/Slide {p_num}]:\n{content}")

        compiled_context = "\n\n---\n\n".join(context_text_blocks)
        return doc_title, context_chunks, compiled_context

    async def teach_chunk(
        self,
        unit_code: str,
        topic: str,
        document_id: Optional[str] = None,
        chunk_index: int = 0,
        student_response: Optional[str] = None,
        explain_deeper: bool = False
    ) -> Dict[str, Any]:
        """
        Teaches a single pedagogical chunk in the 5-step curriculum.
        """
        chunk_index = max(0, min(chunk_index, len(PEDAGOGICAL_STAGES) - 1))
        stage_info = PEDAGOGICAL_STAGES[chunk_index]

        doc_title, raw_chunks, context_text = await self._fetch_context(unit_code, topic, document_id)
        effective_topic = topic or doc_title or f"{unit_code} Core Concept"

        system_instruction = f"""You are the Distinguished Chair Professor of Computer Science at the University of Nairobi teaching unit [{unit_code}].
You are world-renowned for your clarity, pedagogical brilliance, and absolute refusal to give superficial summaries.

Your goal is to guide the student through a 5-step Socratic Mastery Journey:
Step 0: The Architectural Dilemma & First Principles (The Why & The Naive Failure)
Step 1: The Core Abstraction & Mental Model (First Principles, Metaphor & Indirection)
Step 2: Mechanical Step-by-Step Trace & Architecture (ASCII Diagrams, Memory Maps, State Transitions)
Step 3: Lecturer Exam Traps & Chiromo Edge Cases (Gotchas, Calculation Pitfalls, Examiner Traps)
Step 4: Socratic Checkpoint & Active Mastery Drill (Active Recall Challenge & Synthesis)

CURRENT PEDAGOGICAL ASSIGNMENT:
- You are delivering Chunk {chunk_index + 1} of 5: **{stage_info['stage_name']}**
- Pedagogical Objective: {stage_info['objective']}
- Explain Deeper Mode: {"ACTIVATED (Provide extra mechanical intuition and intuitive analogies)" if explain_deeper else "STANDARD"}

CRITICAL TEACHING RULES:
1. NO DRY HIGH-LEVEL SUMMARIES. Do not just define words. Explain the underlying physics/mechanics of why systems are designed this way.
2. In Step 2 (or whenever beneficial), USE ASCII DIAGRAMS, memory layouts, or execution tables inside markdown code blocks (```text).
3. Ground your explanation in the provided lecture context whenever available, citing `[{unit_code} | Slide X]`.
4. If the student provided an answer to a previous Socratic challenge, critique it first with constructive, rigorous feedback.

OUTPUT FORMAT:
Return strictly a valid JSON object with these exact keys:
{{
  "topic_title": "string (Concise title of the overarching subject)",
  "chunk_index": {chunk_index},
  "total_chunks": 5,
  "chunk_title": "string (Inspiring title for this specific stage)",
  "first_principles_essence": "string (1-2 sentences capturing the irreducible core insight)",
  "critique_of_previous_answer": "string or null (If student answered previously, grade their answer out of 10 and give precise professor feedback)",
  "lecture_content": "string (Rich markdown lecture content. Must be detailed, rigorous, step-by-step with ASCII diagrams and concrete examples)",
  "exam_trap": "string (Exact trap or subtle trick Chiromo lecturers like to put in exams on this topic)",
  "socratic_challenge": "string (A sharp, probing question testing active recall or conceptual application before moving to the next chunk)",
  "next_chunk_preview": "string (A 1-sentence teaser of what the next chunk will reveal)"
}}"""

        user_prompt = f"""Unit: {unit_code}
Subject/Topic: {effective_topic}
Current Stage: {stage_info['stage_name']} (Chunk {chunk_index + 1}/5)

Student Response to Previous Checkpoint: {student_response if student_response else "None (First interaction or advancing directly)"}

SOURCE LECTURE MATERIAL & EXTRACTED NOTES:
{context_text if context_text else f"[Standard {unit_code} Curriculum Context for {effective_topic}]"}

Deliver Chunk {chunk_index + 1}: {stage_info['stage_name']} according to the professor guidelines. Output strictly valid JSON."""

        raw_response = await rag_router.generate_text(
            system_instruction=system_instruction,
            user_prompt=user_prompt
        )

        # Parse JSON output safely
        parsed = self._extract_json(raw_response)
        if not parsed:
            # Fallback structure if JSON parse failed
            parsed = {
                "topic_title": effective_topic,
                "chunk_index": chunk_index,
                "total_chunks": 5,
                "chunk_title": stage_info["stage_name"],
                "first_principles_essence": f"Mastering {effective_topic} requires understanding its fundamental trade-offs.",
                "critique_of_previous_answer": None,
                "lecture_content": raw_response,
                "exam_trap": "Beware of subtle timing conditions and boundary value errors in section B exam problems.",
                "socratic_challenge": f"How does the concept of {effective_topic} prevent system failure under concurrent load?",
                "next_chunk_preview": "Next chunk dives deeper into the mechanical architecture."
            }

        # Add citation references
        citations = []
        for c in raw_chunks[:4]:
            meta = c.get("metadata", {})
            citations.append({
                "page_number": c.get("page_number", 1),
                "slide_title": c.get("slide_title") or doc_title or "Lecture Slide",
                "preview": c.get("content", "")[:200]
            })
        parsed["citations"] = citations

        return parsed

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extracts JSON object from markdown fenced blocks or raw strings."""
        clean = text.strip()
        if "```json" in clean:
            clean = clean.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in clean:
            clean = clean.split("```", 1)[1].split("```", 1)[0].strip()

        try:
            return json.loads(clean)
        except Exception:
            try:
                # Find the first { and last }
                start = clean.find("{")
                end = clean.rfind("}")
                if start != -1 and end != -1:
                    return json.loads(clean[start:end+1])
            except Exception as e:
                logger.error(f"Failed to parse professor JSON response: {e}")
                return None


professor_service = ProfessorService()
