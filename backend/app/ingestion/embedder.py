from typing import List
import logging
from openai import AzureOpenAI, OpenAI
from app.core.config import settings
from app.core.native_client import get_gemini_embedding_native, get_gemini_embeddings_batch

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.client = None
        self.is_azure = False
        self.is_gemini = False

        if settings.GEMINI_API_KEY:
            self.is_gemini = True
            logger.info("EmbeddingService initialized with Native Gemini 1536-dim embeddings.")
        
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            if "/openai/v1" in settings.AZURE_OPENAI_ENDPOINT or "/openai" in settings.AZURE_OPENAI_ENDPOINT:
                # Foundry OpenAI-compatible v1 endpoint requires standard OpenAI class with base_url
                self.client = OpenAI(
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    base_url=settings.AZURE_OPENAI_ENDPOINT
                )
            else:
                self.client = AzureOpenAI(
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    api_version=settings.AZURE_OPENAI_API_VERSION,
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
                )
            self.model_name = settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT or "text-embedding-3-small"
            self.is_azure = True
        elif settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model_name = "text-embedding-3-small"
            self.is_azure = False
        else:
            if not self.is_gemini:
                logger.warning("No embedding credentials configured.")

    def get_embedding(self, text: str) -> List[float]:
        """Embeds a single query string into a 1536-dimensional vector with resilient fallbacks."""
        # 1. Try Native Gemini Embeddings if configured
        if self.is_gemini:
            try:
                emb = get_gemini_embedding_native(text)
                if emb and len(emb) == 1536 and any(v != 0.0 for v in emb):
                    return emb
            except Exception as ge:
                logger.warning(f"Native Gemini embedding failed: {ge}")

        # 2. Try OpenAI / Azure Foundry Embeddings if client configured
        if self.client:
            try:
                clean_text = (text or "").replace("\n", " ").strip()[:6000]
                if not clean_text:
                    clean_text = "Academic study material content"
                response = self.client.embeddings.create(
                    input=[clean_text],
                    model=self.model_name
                )
                if response.data and response.data[0].embedding:
                    return response.data[0].embedding
            except Exception as ce:
                logger.warning(f"Client embedding create failed: {ce}")

        # 3. Final attempt via Gemini if API key is present
        if settings.GEMINI_API_KEY:
            try:
                return get_gemini_embedding_native(text)
            except Exception:
                pass

        logger.warning("All embedding providers failed; returning 1536-dim zero vector fallback.")
        return [0.0] * 1536

    def embed_query(self, text: str) -> dict:
        """Alias for compatibility across legacy and agent routes."""
        try:
            return {"embedding": self.get_embedding(text)}
        except Exception as e:
            logger.warning(f"Embedding query failed: {e}")
            return {"embedding": []}

    def get_embeddings_batch(self, texts: List[str], batch_size: int = 80) -> List[List[float]]:
        """Batch embeds chunks with 100x acceleration via batch API."""
        if not texts:
            return []

        if self.is_gemini:
            return get_gemini_embeddings_batch(texts, batch_size=batch_size)

        if not self.client:
            raise ValueError("Embedding client is not configured.")

        all_embeddings: List[List[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = [t.replace("\n", " ").strip() for t in texts[i:i+batch_size]]
            response = self.client.embeddings.create(
                input=batch,
                model=self.model_name
            )
            for item in response.data:
                all_embeddings.append(item.embedding)

        return all_embeddings


embedding_service = EmbeddingService()
