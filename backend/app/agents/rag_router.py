import logging
from typing import Dict, Any, List, Optional
from openai import AzureOpenAI, OpenAI
from tavily import TavilyClient
from app.core.config import settings
from app.core.database import match_unit_chunks_rpc
from app.core.native_client import generate_gemini_content
from app.ingestion.embedder import embedding_service

logger = logging.getLogger(__name__)


class RagAgentRouter:
    def __init__(self):
        # LLM Clients: Gemini / Azure / OpenAI
        self.is_gemini = False
        self.is_azure = False
        self.llm_client = None

        if settings.GEMINI_API_KEY:
            self.is_gemini = True
            logger.info("RagAgentRouter initialized with Native Gemini Brain.")
        elif settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.llm_client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.chat_model = settings.AZURE_OPENAI_CHAT_DEPLOYMENT
            self.is_azure = True
        elif settings.OPENAI_API_KEY:
            self.llm_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.chat_model = "gpt-4o-mini"
            self.is_azure = False
        else:
            logger.warning("No LLM client credentials configured.")

        # Tavily Search Client
        self.tavily_client = None
        if settings.TAVILY_API_KEY:
            self.tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)

    async def generate_text(self, system_instruction: str, user_prompt: str) -> str:
        """Universal text generator across Gemini, Azure OpenAI, and OpenAI."""
        if self.is_gemini:
            return generate_gemini_content(system_instruction, user_prompt)

        if self.llm_client:
            resp = self.llm_client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2
            )
            return resp.choices[0].message.content or ""

        return "⚠️ No LLM brain configured."

    async def execute_query(
        self,
        unit_code: str,
        query: str,
        deep_search: bool = False,
        similarity_threshold: float = 0.68,
        top_k: int = 6
    ) -> Dict[str, Any]:
        """
        Executes unit-isolated RAG retrieval.
        Autonomously routes to Tavily academic search if local context is insufficient or deep_search is requested.
        """
        # 1. Embed student query
        query_vector = embedding_service.get_embedding(query)

        # 2. Query unit-isolated chunks
        local_chunks = await match_unit_chunks_rpc(
            unit_code=unit_code,
            query_embedding=query_vector,
            match_threshold=similarity_threshold,
            match_count=top_k
        )

        # Determine if web fallback is needed
        max_similarity = max([c.get("similarity", 0) for c in local_chunks], default=0)
        web_search_needed = deep_search or (max_similarity < similarity_threshold) or (len(local_chunks) == 0)

        web_results = []
        if web_search_needed and self.tavily_client:
            try:
                search_query = f"{query} in context of {unit_code} University Computer Science"
                search_response = self.tavily_client.search(
                    query=search_query,
                    search_depth="advanced",
                    max_results=3,
                    include_domains=["geeksforgeeks.org", "wikipedia.org", "tutorialspoint.com", "arxiv.org", "mit.edu", "stanford.edu", "github.com"]
                )
                web_results = search_response.get("results", [])
            except Exception as e:
                logger.error(f"Error invoking Tavily search: {e}")

        # 3. Construct Grounded Prompt
        system_instruction, user_content = self._build_synthesis_prompt(
            unit_code=unit_code,
            query=query,
            local_chunks=local_chunks,
            web_results=web_results
        )

        # 4. Generate LLM Response
        answer_text = await self.generate_text(system_instruction, user_content)

        # Extract structured citations
        citations = []
        for c in local_chunks:
            meta = c.get("metadata", {})
            citations.append({
                "type": "local_slide",
                "unit_code": unit_code,
                "file_name": meta.get("file_name", "Course Document"),
                "page_number": c.get("page_number", 1),
                "slide_title": c.get("slide_title", ""),
                "similarity": c.get("similarity", 0),
                "content_preview": c.get("content", "")[:300]
            })

        external_citations = [
            {"type": "web", "title": r.get("title"), "url": r.get("url")}
            for r in web_results
        ]

        return {
            "answer": answer_text,
            "citations": citations,
            "external_sources": external_citations,
            "web_search_used": web_search_needed and len(web_results) > 0,
            "max_similarity": max_similarity
        }

    def _build_synthesis_prompt(
        self,
        unit_code: str,
        query: str,
        local_chunks: List[Dict[str, Any]],
        web_results: List[Dict[str, Any]]
    ):
        system_instruction = f"""You are the UoN Chiromo Academic AI Copilot for unit [{unit_code}].
Your role is to help Computer Science students master this syllabus, ace CATs, and pass final exams.

STRICT GROUNDING & CITATION RULES:
1. Prioritize lecturer course notes whenever available.
2. When referencing facts from lecturer notes, cite them strictly as:
   `[{unit_code} | <File Name> | Slide <Page #>]`
3. If external web search results are provided, format them as:
   `[Web: <Domain> | <Title>]`
4. Answer structure for university exam readiness:
   - Direct Academic Definition / Summary
   - Step-by-Step Technical Explanation (use LaTeX math `$ ... $` for formulas or equations)
   - Architectural diagrams in Mermaid syntax (```mermaid ... ```) where applicable
   - Practical Trade-offs or Common Exam Pitfalls
5. Do NOT hallucinate. If neither the lecturer slides nor web results contain the answer, explicitly state: "This concept is not present in the indexed materials for {unit_code}."
"""
        context_blocks = []
        if local_chunks:
            context_blocks.append("--- LECTURER COURSE NOTES CONTEXT ---")
            for i, c in enumerate(local_chunks, 1):
                meta = c.get("metadata", {})
                context_blocks.append(
                    f"[{i}] File: {meta.get('file_name', 'Doc')} | Page/Slide: {c.get('page_number')} | Title: {c.get('slide_title')}\n"
                    f"{c.get('content')}\n"
                )

        if web_results:
            context_blocks.append("--- VERIFIED ACADEMIC WEB SOURCES ---")
            for i, r in enumerate(web_results, 1):
                context_blocks.append(
                    f"[Web {i}] Title: {r.get('title')} | URL: {r.get('url')}\n"
                    f"{r.get('content')}\n"
                )

        context_text = "\n".join(context_blocks) if context_blocks else "No local materials or web sources matched this query."

        user_content = f"""STUDENT QUERY:
{query}

RETRIEVED CONTEXT:
{context_text}
"""
        return system_instruction, user_content


rag_router = RagAgentRouter()
