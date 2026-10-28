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
        elif settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            self.model_name = settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
            self.is_azure = True
        elif settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model_name = "text-embedding-3-small"
            self.is_azure = False
        else:
            logger.warning("No embedding credentials configured.")

    def get_embedding(self, text: str) -> List[float]:
        """Embeds a single query string into a 1536-dimensional vector."""
        if self.is_gemini:
            return get_gemini_embedding_native(text)

        if not self.client:
            raise ValueError("Embedding client is not configured.")

        clean_text = text.replace("\n", " ").strip()
        response = self.client.embeddings.create(
            input=[clean_text],
            model=self.model_name
        )
        return response.data[0].embedding

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
