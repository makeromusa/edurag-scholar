import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

from app.agents.rag_router import rag_router
from app.api.assignment_routes import (
    AssignmentSolveRequest,
    _extract_mermaid_blocks,
    solve_assignment,
)
from app.core.config import settings
from app.core.mongodb import get_api_keys_collection
from app.core.database import get_supabase_admin_client

logger = logging.getLogger(__name__)

developer_router = APIRouter(prefix="/v1", tags=["Developer Platform API"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


# --- Models ---
class CreateApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Friendly label for this API key")


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    created_at: str
    last_used_at: Optional[str] = None
    api_key: Optional[str] = None  # Returned only upon initial creation


class DeveloperChatRequest(BaseModel):
    unit_code: str = Field(..., description="Course unit code, e.g. SCS 3201")
    query: str = Field(..., description="Student or developer academic question")
    deep_search: bool = Field(False, description="Whether to invoke live web search fallback")
    provider: Optional[str] = Field("auto", description="LLM provider: 'auto', 'azure', 'gemini', or 'grok'")


class DiagramGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Architecture, algorithm, or process description to turn into a diagram")
    diagram_type: Optional[str] = Field("auto", description="auto, flowchart, sequence, class, state, or erd")


# --- Auth Helpers ---
def _hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


async def verify_api_key(x_api_key: Optional[str] = Security(api_key_header)) -> Dict[str, Any]:
    """Validates X-API-Key header against MongoDB or Master Key."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing 'X-API-Key' authentication header. Generate an API key in your EduRAG dashboard."
        )

    # Master key bypass (for system services or admin automation)
    if settings.EDURAG_MASTER_API_KEY and x_api_key == settings.EDURAG_MASTER_API_KEY:
        return {"user_id": "master-admin", "name": "Master System Key", "is_master": True}

    # Verify against MongoDB
    try:
        col = get_api_keys_collection()
        hashed = _hash_key(x_api_key)
        key_record = await col.find_one({"key_hash": hashed, "is_active": True})
        if not key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked API key."
            )

        # Update last_used_at timestamp asynchronously
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            await col.update_one({"_id": key_record["_id"]}, {"$set": {"last_used_at": now_iso}})
        except Exception:
            pass

        return key_record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking API key in MongoDB: {e}")
        raise HTTPException(status_code=500, detail="Authentication verification service error.")


def _get_user_from_bearer(authorization: Optional[str]) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    try:
        client = get_supabase_admin_client()
        res = client.auth.get_user(token)
        if res and res.user:
            return {"id": res.user.id, "email": res.user.email}
    except Exception as e:
        logger.warning(f"Failed to authenticate user token: {e}")
    return None


SUPER_ADMIN_EMAIL = "makeromusa17@gmail.com"


def require_super_admin(authorization: Optional[str]) -> Dict[str, Any]:
    """Ensures ONLY the immutable Super Admin (makeromusa17@gmail.com) can manage developer API keys."""
    user = _get_user_from_bearer(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    user_email = (user.get("email") or "").lower().strip()
    if user_email != SUPER_ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Developer API Key management is restricted exclusively to the Super Admin."
        )
    return user


# --- Key Management Endpoints ---
@developer_router.post("/auth/keys", response_model=ApiKeyResponse)
async def generate_api_key(
    payload: CreateApiKeyRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Generates a new developer API key for programmatic access.
    Restricted strictly to the Super Admin (makeromusa17@gmail.com).
    """
    user = require_super_admin(authorization)

    raw_token = f"edurag_live_{secrets.token_hex(20)}"
    key_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "_id": key_id,
        "name": payload.name.strip(),
        "key_hash": _hash_key(raw_token),
        "prefix": raw_token[:16] + "...",
        "user_id": user["id"],
        "user_email": user.get("email"),
        "created_at": now_iso,
        "last_used_at": None,
        "is_active": True,
    }

    try:
        col = get_api_keys_collection()
        await col.insert_one(doc)
    except Exception as e:
        logger.error(f"Failed to save API key to MongoDB: {e}")
        raise HTTPException(status_code=500, detail="Database error saving API key.")

    return ApiKeyResponse(
        id=key_id,
        name=doc["name"],
        prefix=doc["prefix"],
        created_at=doc["created_at"],
        last_used_at=None,
        api_key=raw_token
    )


@developer_router.get("/auth/keys", response_model=List[ApiKeyResponse])
async def list_api_keys(authorization: Optional[str] = Header(None)):
    """Lists all active API keys. Restricted strictly to the Super Admin."""
    user = require_super_admin(authorization)

    keys: List[ApiKeyResponse] = []
    try:
        col = get_api_keys_collection()
        cursor = col.find({"is_active": True}).sort("created_at", -1)
        async for doc in cursor:
            keys.append(ApiKeyResponse(
                id=str(doc["_id"]),
                name=doc.get("name", "Default API Key"),
                prefix=doc.get("prefix", "edurag_live_..."),
                created_at=doc.get("created_at", ""),
                last_used_at=doc.get("last_used_at"),
                api_key=None
            ))
    except Exception as e:
        logger.error(f"Failed to read API keys: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve API keys.")

    return keys


@developer_router.delete("/auth/keys/{key_id}")
async def revoke_api_key(key_id: str, authorization: Optional[str] = Header(None)):
    """Revokes an API key. Restricted strictly to the Super Admin."""
    user = require_super_admin(authorization)

    try:
        col = get_api_keys_collection()
        res = await col.update_one(
            {"_id": key_id},
            {"$set": {"is_active": False, "revoked_at": datetime.now(timezone.utc).isoformat(), "revoked_by": user["email"]}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="API key not found.")
        return {"status": "success", "message": "API key revoked successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking API key: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke key.")


# --- Public / Key-Secured Developer Endpoints ---
@developer_router.post("/chat")
async def developer_chat(
    payload: DeveloperChatRequest,
    key_info: Dict[str, Any] = Depends(verify_api_key)
):
    """
    Programmatic endpoint for RAG queries against university course materials.
    Returns syllabus citations and live web results.
    """
    result = await rag_router.execute_query(
        unit_code=payload.unit_code,
        query=payload.query,
        deep_search=payload.deep_search
    )
    return {
        "status": "success",
        "unit_code": payload.unit_code,
        "query": payload.query,
        "answer": result.get("answer", ""),
        "citations": result.get("citations", []),
        "external_sources": result.get("external_sources", []),
        "authenticated_key": key_info.get("name", "Active Key"),
    }


@developer_router.post("/assignments/solve")
async def developer_solve_assignment(
    payload: AssignmentSolveRequest,
    key_info: Dict[str, Any] = Depends(verify_api_key)
):
    """
    Programmatic endpoint to solve assignments with syllabus grounding,
    Mermaid diagrams, and viva defense questions.
    """
    return await solve_assignment(payload)


@developer_router.post("/diagrams/generate")
async def developer_generate_diagram(
    payload: DiagramGenerateRequest,
    key_info: Dict[str, Any] = Depends(verify_api_key)
):
    """
    Programmatic technical diagram synthesizer.
    Produces syntactically valid Mermaid.js diagrams (Flowcharts, ERDs, UML, System Architectures).
    """
    sys_instruction = """You are a Principal Software Architect and Computer Systems Professor.
Synthesize an executable, perfectly formatted Mermaid.js diagram representing the user's scenario.
Follow standard Mermaid syntax:
- Output only the ```mermaid ... ``` code block.
- For flowcharts, use 'flowchart TD' or 'graph TD'.
- For entity relationship schemas, use 'erDiagram'.
- For sequence flows, use 'sequenceDiagram'.
- For system architectures, use clear subgraphs and directed links.
Do not wrap with extraneous conversational text. Output pure, valid Mermaid markdown."""

    user_query = f"Generate a {payload.diagram_type} diagram for: {payload.prompt}"
    mermaid_markdown = await rag_router.generate_text(sys_instruction, user_query)

    blocks = _extract_mermaid_blocks(mermaid_markdown)
    primary_code = blocks[0] if blocks else mermaid_markdown.strip("` \n")

    return {
        "status": "success",
        "diagram_type": payload.diagram_type,
        "mermaid_code": primary_code,
        "preview_type": "mermaid",
        "raw_response": mermaid_markdown
    }


@developer_router.get("/units")
async def developer_list_units(key_info: Dict[str, Any] = Depends(verify_api_key)):
    """Lists all available course units in the EduRAG platform."""
    client = get_supabase_admin_client()
    res = client.table("units").select("code,name,lecturer,venue,semester,academic_year,description,is_system_unit").eq("status", "active").execute()
    return {"units": res.data or []}
