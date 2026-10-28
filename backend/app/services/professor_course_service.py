import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.core.database import get_supabase_admin_client, match_unit_chunks_rpc
from app.agents.rag_router import rag_router
from app.ingestion.embedder import embedding_service

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """Removes private use and unprintable characters extracted from PDF fonts."""
    if not text:
        return ""
    # Strip unicode private use area characters (\uf000 to \uf8ff)
    text = re.sub(r'[\uf000-\uf8ff]', '', text)
    # Collapse excess whitespace
    return re.sub(r'\s+', ' ', text).strip()

class ProfessorCourseService:
    def __init__(self):
        pass

    async def get_document_syllabus(self, document_id: str) -> Dict[str, Any]:
        """
        Analyzes an uploaded document or textbook from page 1 to the end,
        and dynamically clusters all slides/pages into sequential, coherent Lesson Batches.
        """
        client = get_supabase_admin_client()
        doc = client.table("documents").select("id, title, page_count, unit_code").eq("id", document_id).execute()
        if not doc.data:
            return {"error": "Document not found", "lessons": []}

        doc_meta = doc.data[0]
        total_pages = doc_meta.get("page_count", 0)

        # Fetch page numbers and slide titles
        chunks = client.table("document_chunks") \
            .select("page_number, slide_title") \
            .eq("document_id", document_id) \
            .order("page_number") \
            .execute()

        raw_slides = chunks.data or []
        if not raw_slides:
            return {
                "document_id": document_id,
                "document_title": doc_meta.get("title"),
                "total_pages": total_pages,
                "lessons": []
            }

        # Determine optimal lesson batch size:
        # Smaller, focused batches (4 to 6 slides) prevent generation timeouts and maintain deep pedagogical precision.
        batch_size = 5

        lessons = []
        lesson_idx = 1
        current_page = 1

        # Map page numbers to slide titles
        page_titles: Dict[int, str] = {}
        individual_slides = []
        seen_pages = set()

        for s in raw_slides:
            p = s.get("page_number", 1)
            t = clean_text(s.get("slide_title") or "")
            if p not in page_titles or (len(t) > len(page_titles[p]) and not t.isdigit()):
                page_titles[p] = t or f"Slide {p}"
            if p not in seen_pages:
                seen_pages.add(p)
                individual_slides.append({
                    "page_number": p,
                    "title": t or f"Slide {p}"
                })

        individual_slides.sort(key=lambda x: x["page_number"])
        max_page = max(page_titles.keys(), default=total_pages)

        while current_page <= max_page:
            start_p = current_page
            end_p = min(current_page + batch_size - 1, max_page)

            # Extract distinct topics in this batch
            batch_topics = [
                page_titles[p] for p in range(start_p, end_p + 1)
                if p in page_titles and page_titles[p] and not page_titles[p].isdigit()
            ]
            distinct_topics = list(dict.fromkeys(batch_topics))

            # Determine dominant title for this lesson
            if distinct_topics:
                lesson_title = distinct_topics[0]
                if len(distinct_topics) > 1:
                    lesson_title += f" & {distinct_topics[1]}"
            else:
                lesson_title = f"{doc_meta.get('title')} — Part {lesson_idx}"

            lessons.append({
                "lesson_id": lesson_idx,
                "title": lesson_title,
                "start_page": start_p,
                "end_page": end_p,
                "slide_count": (end_p - start_p + 1),
                "topics": distinct_topics[:4]
            })

            lesson_idx += 1
            current_page = end_p + 1

        return {
            "document_id": document_id,
            "document_title": doc_meta.get("title"),
            "unit_code": doc_meta.get("unit_code"),
            "total_pages": total_pages,
            "total_lessons": len(lessons),
            "lessons": lessons,
            "individual_slides": individual_slides
        }

    async def get_slide_raw_content(self, document_id: str, page_number: int) -> Dict[str, Any]:
        """Fetches raw extracted text of an individual slide in < 50ms."""
        client = get_supabase_admin_client()
        chunks = client.table("document_chunks") \
            .select("page_number, slide_title, content") \
            .eq("document_id", document_id) \
            .eq("page_number", page_number) \
            .execute()
        
        raw_text = "\n".join([c.get("content", "").strip() for c in (chunks.data or []) if c.get("content")])
        slide_title = chunks.data[0].get("slide_title") if chunks.data else f"Slide {page_number}"
        return {
            "document_id": document_id,
            "page_number": page_number,
            "slide_title": clean_text(slide_title),
            "content": raw_text or f"[No selectable text found on Slide {page_number}]"
        }

    async def teach_lesson_batch(
        self,
        document_id: str,
        unit_code: str,
        start_page: int,
        end_page: int,
        custom_focus: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Teaches a specific lesson batch (e.g. Slides 1 to 8) from a document.
        MANDATE: Teaches in FAR GREATER DETAIL than the slides themselves.
        Unpacks all bullet points into theoretical mechanics, code, memory maps, and exam problems.
        """
        client = get_supabase_admin_client()
        
        # 1. Fetch document metadata
        doc = client.table("documents").select("title, unit_code").eq("id", document_id).execute()
        doc_title = doc.data[0].get("title") if doc.data else "Course Document"

        # 2. Fetch all slide chunks in this range
        chunks = client.table("document_chunks") \
            .select("page_number, slide_title, content") \
            .eq("document_id", document_id) \
            .gte("page_number", start_page) \
            .lte("page_number", end_page) \
            .order("page_number") \
            .execute()

        slide_texts = []
        for c in (chunks.data or []):
            p = c.get("page_number")
            t = c.get("slide_title") or f"Slide {p}"
            cnt = c.get("content", "").strip()
            slide_texts.append(f"--- [Slide / Page {p}: {t}] ---\n{cnt}")

        compiled_slides = "\n\n".join(slide_texts)
        if not compiled_slides:
            compiled_slides = f"[No raw text extracted for pages {start_page} to {end_page}]"

        is_single_slide = (start_page == end_page)
        slide_sample_lower = compiled_slides.lower()
        is_outline_or_intro = (start_page == 1 and (end_page - start_page + 1) <= 2) or any(
            kw in slide_sample_lower
            for kw in ["course outline", "syllabus", "course overview", "grading criteria", "course objectives", "prerequisites"]
        )

        if is_single_slide and is_outline_or_intro:
            system_instruction = f"""You are a distinguished Senior Full Professor of Computer Science at the University of Nairobi teaching [{unit_code}].
You are delivering a foundational course orientation and syllabus roadmap based on Slide/Page {start_page} of '{doc_title}'.

ABSOLUTE PEDAGOGICAL DIRECTIVE:
1. DO NOT fabricate artificial Section B calculations on lecturer names or course outlines.
2. Provide a rigorous, inspiring academic orientation:
   - Outline the foundational pillars of {unit_code} and how this course interfaces with hardware, OS kernels, algorithms, or systems programming.
   - Clarify the mathematical/programming prerequisites needed to excel.
   - Explain the Chiromo examination architecture: Section A (30 marks compulsory breadth testing) and Section B (Answer 2 of 3 questions, 20 marks each, deep derivations/code).
   - Point to authoritative reference textbooks (e.g. Silberschatz, Stallings, Tanenbaum, Cormen).

OUTPUT STRUCTURE:
# 🎓 Course Architecture & Orientation: [{doc_title}]
**Source:** {doc_title} • Slide {start_page} • Unit {unit_code}

## 1. 🧭 Unit Architecture & Pedagogical Roadmap
(Explain the central mission of this course, how concepts build sequentially, and what engineering capabilities the student will master)

## 2. 🏛️ Core Foundational Concepts & Systems Prerequisites
(Key computer systems, memory hierarchy, data structures, or math background required)

## 3. 🎯 Chiromo Examination Strategy & Paper Structure
(Detailed breakdown of Section A compulsory questions vs Section B in-depth design/calculation questions)

## 4. 📚 Essential Reference Literature & Standard Texts
(Canonical university textbooks and low-level specifications to consult)
"""

        elif is_single_slide:
            system_instruction = f"""You are a distinguished Senior Full Professor of Computer Science at the University of Nairobi teaching [{unit_code}].
You are delivering a focused single-slide technical masterclass on Slide/Page {start_page} of '{doc_title}'.

ABSOLUTE PEDAGOGICAL DIRECTIVE:
1. DO NOT GIVE A SUMMARY. Summaries are useless to a Computer Science student preparing for university exams.
2. The provided slide only contains brief bullet points. YOUR JOB IS TO TEACH IN FAR GREATER DETAIL THAN THE SLIDE ITSELF.
3. Deconstruct the low-level mechanical reality: Explain the hardware, memory, registers, kernel data structures, and algorithm execution.
4. Explain WHAT THE SLIDE LEFT UNSAID: Address the hidden assumptions, edge cases, and why naive implementations break.
5. Provide concrete, working code (C, C++, Python, or Assembly) and ASCII architectural memory maps.
6. Detail the exact Chiromo exam question Dr. Miriti/the lecturer asks from this specific concept.

OUTPUT STRUCTURE:
# 🎓 Technical Deep Dive: Slide {start_page} — [Topic Title]
**Source:** {doc_title} • Slide {start_page} • Unit {unit_code}

## 1. 📌 Core Mechanical Concept & Theoretical Definition
(Precise, rigorous formal definition and architectural context)

## 2. 🔍 Low-Level Engineering: What The Slide Left Unsaid
(Detailed deconstruction of the kernel/hardware mechanisms, data structures, and execution flow)

## 3. 💻 Working Implementation & Memory Layout
(Concrete C/Python code and ASCII memory/register layout in code blocks)

## 4. ⚠️ Chiromo Lecturer Exam Questions & Pitfalls on This Slide
(Direct exam questions, trick conditions, and marking scheme pitfalls for this specific concept)

## 5. 🎯 First-Principles Self-Test
(2 sharp Socratic questions to test deep mechanical understanding)
"""

        else:
            system_instruction = f"""You are a distinguished Senior Full Professor of Computer Science at the University of Nairobi teaching [{unit_code}].
You are delivering a masterclass lecture covering Slides/Pages {start_page} to {end_page} from the course material: '{doc_title}'.

ABSOLUTE PEDAGOGICAL DIRECTIVE:
1. DO NOT GIVE A SUMMARY. Summaries are useless to a Computer Science student preparing for university exams.
2. The provided slides only contain brief bullet points. YOUR JOB IS TO TEACH IN FAR GREATER DETAIL THAN THE SLIDES THEMSELVES.
3. For every major concept in this slide batch:
   - Deconstruct the low-level mechanical reality: Explain the hardware, memory, registers, kernel data structures, and algorithm execution.
   - Explain WHAT THE SLIDE LEFT UNSAID: Address the hidden assumptions, the edge cases, and why naive implementations break.
   - Provide concrete, working code (C, C++, Python, or Assembly) where applicable.
   - Provide ASCII architectural diagrams, memory maps, or process state transition flows in code blocks (```text).
   - Chiromo Exam Masterclass: Explain the exact Section B derivation, calculation, or tricky edge case Dr. Miriti/the lecturer will test from this batch of slides.

Deliver a rigorous, illuminating, graduate-level academic lecture that transforms the student into a master of this topic.

OUTPUT STRUCTURE:
Format your lecture clearly in Markdown with these structured sections:
# 🎓 Masterclass Lecture: [Comprehensive Lesson Title]
**Source:** {doc_title} • Slides {start_page}–{end_page} • Unit {unit_code}

## 1. 📌 Core Thesis & The Architectural Dilemma
(Explain the fundamental problem that forced the invention of the concepts on these slides. Why do naive solutions fail?)

## 2. 🔍 Deep Deconstruction: What The Slides Don't Tell You
(Go through the concepts on Slides {start_page} to {end_page} in extreme technical depth. Unpack every bullet. Provide code, bitwise logic, and memory maps.)

## 3. 📐 Architectural Flow & Memory Layout
(ASCII diagram showing data structures, memory layout, register states, or timeline traces)

## 4. ⚠️ Chiromo Lecturer Exam Traps & Section B Calculations
(The exact exam questions, numerical gotchas, proofs, and marking scheme pitfalls examiners use on these slides)

## 5. 🎯 Socratic Self-Check & Active Recall Questions
(3 sharp, first-principles questions for the student to verify they understood the deep mechanics)
"""

        user_prompt = f"""DOCUMENT: {doc_title}
UNIT: {unit_code}
LESSON RANGE: Slides {start_page} to {end_page}
{"STUDENT'S SPECIFIC FOCUS: " + custom_focus if custom_focus else ""}

RAW LECTURE SLIDES / PAGES ({start_page} to {end_page}):
{compiled_slides}

Deliver the full, deep professor masterclass expanding these slides in complete technical depth."""

        lecture_markdown = await rag_router.generate_text(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
            max_tokens=1600
        )

        return {
            "document_id": document_id,
            "document_title": doc_title,
            "unit_code": unit_code,
            "start_page": start_page,
            "end_page": end_page,
            "lecture_content": lecture_markdown,
            "raw_slides_preview": compiled_slides[:1200]
        }

    async def ask_lesson_question(
        self,
        document_id: str,
        unit_code: str,
        start_page: int,
        end_page: int,
        question: str
    ) -> str:
        """
        Interactive Office Hours: Answers any deep student question strictly grounded in this lesson batch.
        """
        client = get_supabase_admin_client()
        chunks = client.table("document_chunks") \
            .select("page_number, slide_title, content") \
            .eq("document_id", document_id) \
            .gte("page_number", start_page) \
            .lte("page_number", end_page) \
            .order("page_number") \
            .execute()

        slide_texts = [f"Slide {c.get('page_number')}: {c.get('content')}" for c in (chunks.data or [])]
        context = "\n\n".join(slide_texts)[:4000]

        sys_inst = f"""You are the Computer Science Professor for unit [{unit_code}].
A student is in your office hours asking a question regarding Slides {start_page} to {end_page}.
Answer with total academic rigor, first-principles logic, and clear low-level technical depth.
Use code snippets, register/memory diagrams, or mathematical steps whenever it clarifies the student's doubt."""

        user_p = f"""SLIDE CONTEXT (Slides {start_page} to {end_page}):
{context}

STUDENT'S QUESTION:
{question}

Professor's in-depth guidance:"""

        return await rag_router.generate_text(sys_inst, user_p)

    async def search_and_create_curriculum(self, unit_code: str, query: str) -> Dict[str, Any]:
        """
        Retrieves matching books or documents across the unit matching a topic query,
        and provides direct lesson modules.
        """
        client = get_supabase_admin_client()
        # Find matching documents in unit
        docs_res = client.table("documents").select("id, title, page_count").eq("unit_code", unit_code).execute()
        docs = docs_res.data or []
        
        # If no documents uploaded yet for this unit, return clear guidance
        if not docs:
            return {
                "unit_code": unit_code,
                "query": query,
                "documents_found": [],
                "message": f"No course materials uploaded for {unit_code} yet. Upload lecture notes or a textbook to activate lesson-by-lesson teaching."
            }

        # Vector search top matching chunks to identify the best document
        query_vec = embedding_service.get_embedding(f"{unit_code} {query}")
        matches = await match_unit_chunks_rpc(
            unit_code=unit_code,
            query_embedding=query_vec,
            match_threshold=0.55,
            match_count=10
        )

        matched_doc_id = None
        if matches:
            matched_doc_id = matches[0].get("document_id")

        if not matched_doc_id:
            matched_doc_id = docs[0]["id"]

        syllabus = await self.get_document_syllabus(matched_doc_id)
        syllabus["available_documents"] = docs
        return syllabus


professor_course_service = ProfessorCourseService()
