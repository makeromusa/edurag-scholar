import os
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from openai import OpenAI
from app.core.config import settings

client = OpenAI(
    api_key=settings.AZURE_OPENAI_API_KEY,
    base_url=settings.AZURE_OPENAI_ENDPOINT
)

res = client.embeddings.create(
    input=["Test academic content for Operating Systems"],
    model=settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
)

print("Azure embedding success!")
print("Model:", settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT)
print("Vector dimension:", len(res.data[0].embedding))
