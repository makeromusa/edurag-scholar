import json
import logging
import subprocess
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_gemini_content(system_instruction: str, user_prompt: str) -> str:
    """
    Executes a Gemini generation call using Windows native WinHTTP/PowerShell bridge.
    Guarantees zero Python OpenSSL timeouts on Windows network stacks.
    """
    api_key = settings.GEMINI_API_KEY
    model = "gemini-flash-lite-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    combined_prompt = f"{system_instruction}\n\n{user_prompt}".replace('"', '\\"').replace("'", "''")

    ps_script = f"""
$headers = @{{
    'Content-Type' = 'application/json'
    'X-goog-api-key' = '{api_key}'
}}
$body = '{{\"contents\":[{{\"parts\":[{{\"text\":\"{combined_prompt}\"}}]}}]}}'
$res = Invoke-RestMethod -Uri '{url}' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
$res.candidates[0].content.parts[0].text
"""
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=40
        )
        if proc.returncode != 0:
            logger.error(f"PowerShell WinHTTP call failed: {proc.stderr}")
            return "⚠️ Error contacting Gemini via native bridge."
        return proc.stdout.strip()
    except Exception as e:
        logger.error(f"Exception during native Gemini generation: {e}")
        return f"⚠️ Generation error: {e}"


def get_gemini_embedding_native(text: str) -> List[float]:
    """
    Generates 1536-dimensional embeddings via Gemini gemini-embedding-001.
    """
    api_key = settings.GEMINI_API_KEY
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"
    clean_text = text.replace('"', '\\"').replace("'", "''").replace("\n", " ").strip()

    ps_script = f"""
$headers = @{{
    'Content-Type' = 'application/json'
    'X-goog-api-key' = '{api_key}'
}}
$body = '{{\"content\":{{\"parts\":[{{\"text\":\"{clean_text}\"}}]}},\"output_dimensionality\":1536}}'
$res = Invoke-RestMethod -Uri '{url}' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
$res.embedding.values | ConvertTo-Json -Compress
"""
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=30
        )
        if proc.returncode != 0:
            logger.error(f"PowerShell WinHTTP embedding call failed: {proc.stderr}")
            raise RuntimeError(proc.stderr)
        return json.loads(proc.stdout.strip())
    except Exception as e:
        logger.error(f"Exception during native Gemini embedding: {e}")
        raise e
