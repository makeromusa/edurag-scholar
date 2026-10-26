import json
import logging
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_gemini_content(system_instruction: str, user_prompt: str, image_base64: Optional[str] = None) -> str:
    """
    Executes a Gemini generation call with optional multimodal image support.
    Uses native HTTP on Linux/Azure and PowerShell bridge on Windows to avoid OpenSSL quirks.
    """
    api_key = settings.GEMINI_API_KEY
    model = "gemini-flash-lite-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    # If running on Linux (Azure App Service)
    if sys.platform != "win32":
        try:
            parts: List[Dict[str, Any]] = [{"text": user_prompt}]
            if image_base64:
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                })

            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": parts}]
            }
            r = requests.post(url, json=payload, timeout=25)
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error(f"Linux direct Gemini generation failed: {e}")
            return f"⚠️ Generation error: {e}"

    # Windows fallback via WinHTTP
    combined_prompt = f"{system_instruction}\n\n{user_prompt}".replace('"', '\\"').replace("'", "''")
    ps_script = f"""
$headers = @{{
    'Content-Type' = 'application/json'
    'X-goog-api-key' = '{api_key}'
}}
$body = '{{\"contents\":[{{\"parts\":[{{\"text\":\"{combined_prompt}\"}}]}}]}}'
$res = Invoke-RestMethod -Uri 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
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


def get_gemini_embeddings_batch(texts: List[str], batch_size: int = 80) -> List[List[float]]:
    """
    High-performance concurrent batch embedding via Gemini gemini-embedding-2 batchEmbedContents API.
    Processes multiple batches simultaneously using ThreadPoolExecutor for sub-5s processing on 500+ pages.
    """
    if not texts:
        return []

    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key={api_key}"

    def process_single_batch(batch: List[str]) -> List[List[float]]:
        requests_payload = []
        for t in batch:
            clean_t = (t or "").replace("\n", " ").strip()[:6000]
            if not clean_t:
                clean_t = "Academic study material content"
            requests_payload.append({
                "model": "models/gemini-embedding-2",
                "content": {"parts": [{"text": clean_t}]},
                "output_dimensionality": 1536
            })
        try:
            r = requests.post(url, json={"requests": requests_payload}, timeout=15)
            if r.status_code == 200:
                data = r.json()
                embs = []
                for emb in data.get("embeddings", []):
                    vals = emb.get("values", [])
                    embs.append(vals if len(vals) == 1536 else [0.0] * 1536)
                if len(embs) == len(batch):
                    return embs
            else:
                logger.warning(f"batchEmbedContents returned status {r.status_code}: {r.text[:150]}")
        except Exception as e:
            logger.warning(f"Batch embedding HTTP call failed: {e}")

        return [[0.0] * 1536] * len(batch)

    batches = [texts[i:i + batch_size] for i in range(0, len(texts), batch_size)]
    with ThreadPoolExecutor(max_workers=3) as executor:
        batch_results = list(executor.map(process_single_batch, batches))

    return [emb for b_res in batch_results for emb in b_res]


def get_gemini_embedding_native(text: str) -> List[float]:
    """
    Generates 1536-dimensional embeddings via Gemini gemini-embedding-2.
    Gracefully returns zero vector fallback if API fails or quota exceeded.
    """
    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={api_key}"
    clean_text = (text or "").replace("\n", " ").strip()[:6000]
    if not clean_text:
        clean_text = "Academic study material content"

    try:
        payload = {
            "content": {"parts": [{"text": clean_text}]},
            "output_dimensionality": 1536
        }
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "embedding" in data and "values" in data["embedding"]:
                return data["embedding"]["values"]
        logger.warning(f"Gemini single embedding status {r.status_code}: {r.text[:150]}")
        return [0.0] * 1536
    except Exception as e:
        logger.warning(f"Gemini single embedding call failed: {e}")
        return [0.0] * 1536
