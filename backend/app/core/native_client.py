import json
import logging
import os
import subprocess
import sys
from typing import List, Dict, Any
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_gemini_content(system_instruction: str, user_prompt: str) -> str:
    """
    Executes a Gemini generation call.
    Uses native HTTP on Linux/Azure and PowerShell bridge on Windows to avoid OpenSSL quirks.
    """
    api_key = settings.GEMINI_API_KEY
    model = "gemini-flash-lite-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    # If running on Linux (Azure App Service)
    if sys.platform != "win32":
        try:
            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": user_prompt}]}]
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


def get_gemini_embedding_native(text: str) -> List[float]:
    """
    Generates 1536-dimensional embeddings via Gemini gemini-embedding-001.
    Uses native HTTP on Linux (Azure) and PowerShell bridge on Windows.
    """
    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    clean_text = text.replace("\n", " ").strip()

    # Linux (Azure App Service)
    if sys.platform != "win32":
        try:
            payload = {
                "content": {"parts": [{"text": clean_text}]},
                "output_dimensionality": 1536
            }
            r = requests.post(url, json=payload, timeout=20)
            data = r.json()
            return data["embedding"]["values"]
        except Exception as e:
            logger.error(f"Linux direct Gemini embedding failed: {e}")
            raise e

    # Windows fallback via WinHTTP
    escaped_text = clean_text.replace('"', '\\"').replace("'", "''")
    ps_script = f"""
$headers = @{{
    'Content-Type' = 'application/json'
    'X-goog-api-key' = '{api_key}'
}}
$body = '{{\"content\":{{\"parts\":[{{\"text\":\"{escaped_text}\"}}]}},\"output_dimensionality\":1536}}'
$res = Invoke-RestMethod -Uri 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
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
