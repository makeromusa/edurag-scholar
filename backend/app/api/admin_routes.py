"""
Admin Routes — EduRAG Scholar
Only accessible to users with is_admin = TRUE in Supabase profiles.
Super Admin: makeromusa17@gmail.com
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel

from app.core.database import get_supabase_admin_client
from app.core.mongodb import (
    get_chat_transcripts_collection,
    get_mock_exams_collection,
    get_flashcards_collection,
)

logger = logging.getLogger(__name__)
admin_router = APIRouter(prefix="/admin", tags=["admin"])

SUPER_ADMIN_EMAIL = "makeromusa17@gmail.com"


# ─── Auth Guard ──────────────────────────────────────────────────────────────

async def require_admin(authorization: str = Header(None)) -> dict:
    """Verify the caller is an admin. Returns the user row."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = authorization.split(" ", 1)[1]
    supabase = get_supabase_admin_client()
    try:
        resp = supabase.auth.get_user(token)
        user = resp.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")

    # Check is_admin in profiles
    try:
        result = supabase.table("profiles").select("is_admin,email,full_name").eq("id", user.id).maybe_single().execute()
        profile = result.data
    except Exception:
        profile = None

    # Also allow super admin by email even if profile row is missing
    email = (profile or {}).get("email") or (user.email or "")
    is_admin = (profile or {}).get("is_admin", False) or email == SUPER_ADMIN_EMAIL

    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    return {"user": user, "profile": profile, "email": email}


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class BroadcastCreate(BaseModel):
    title: str
    body: str
    target: str = "all"       # "all" | unit_code


class UnitUpdateBody(BaseModel):
    name: Optional[str] = None
    lecturer: Optional[str] = None
    status: Optional[str] = None  # "active" | "archived"


# ─── Overview ────────────────────────────────────────────────────────────────

@admin_router.get("/overview")
async def admin_overview(authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        # Users
        users_resp = supabase.table("profiles").select("id,email,full_name,is_admin,enrolled_units,created_at").execute()
        users = users_resp.data or []
        total_users = len(users)
        admin_count = sum(1 for u in users if u.get("is_admin"))

        # Units
        units_resp = supabase.table("units").select("id,code,name,status").execute()
        units = units_resp.data or []
        total_units = len(units)

        # Documents
        docs_resp = supabase.table("documents").select("id,created_at").execute()
        docs = docs_resp.data or []
        total_docs = len(docs)

        # Chat queries from MongoDB
        total_queries = 0
        try:
            col = await get_chat_transcripts_collection()
            total_queries = await col.count_documents({})
        except Exception:
            pass

        # Exams
        total_exams = 0
        try:
            col = await get_mock_exams_collection()
            total_exams = await col.count_documents({})
        except Exception:
            pass

        # Flashcards
        total_flashcards = 0
        try:
            col = await get_flashcards_collection()
            total_flashcards = await col.count_documents({})
        except Exception:
            pass

        # Recent signups (last 7 days)
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_users = [u for u in users if (u.get("created_at") or "") >= cutoff]

        return {
            "total_users": total_users,
            "admin_count": admin_count,
            "total_units": total_units,
            "total_documents": total_docs,
            "total_queries": total_queries,
            "total_exams": total_exams,
            "total_flashcards": total_flashcards,
            "new_users_this_week": len(recent_users),
            "users_by_enrollment": [
                {"email": u.get("email", ""), "units": len(u.get("enrolled_units") or [])}
                for u in sorted(users, key=lambda x: len(x.get("enrolled_units") or []), reverse=True)[:5]
            ],
        }
    except Exception as e:
        logger.error(f"Admin overview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Users ───────────────────────────────────────────────────────────────────

@admin_router.get("/users")
async def admin_list_users(authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        resp = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        return {"users": resp.data or [], "count": len(resp.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.patch("/users/{user_id}")
async def admin_update_user(user_id: str, body: dict, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    # Allowed fields to update
    allowed = {"is_admin", "full_name", "enrolled_units"}
    update_data = {k: v for k, v in body.items() if k in allowed}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update.")
    try:
        resp = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        # Soft-delete via auth admin (requires service key)
        supabase.auth.admin.delete_user(user_id)
        supabase.table("profiles").delete().eq("id", user_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Units ───────────────────────────────────────────────────────────────────

@admin_router.get("/units")
async def admin_list_units(authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        units_resp = supabase.table("units").select("*").order("code").execute()
        units = units_resp.data or []
        # Attach doc count per unit
        docs_resp = supabase.table("documents").select("unit_code").execute()
        docs = docs_resp.data or []
        doc_count_map: dict = {}
        for d in docs:
            uc = d.get("unit_code", "")
            doc_count_map[uc] = doc_count_map.get(uc, 0) + 1
        for u in units:
            u["doc_count"] = doc_count_map.get(u.get("code", ""), 0)
        return {"units": units, "count": len(units)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.patch("/units/{unit_id}")
async def admin_update_unit(unit_id: str, body: UnitUpdateBody, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    try:
        resp = supabase.table("units").update(update_data).eq("id", unit_id).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/units/{unit_id}")
async def admin_delete_unit(unit_id: str, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        supabase.table("units").delete().eq("id", unit_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── AI Intelligence / Queries ───────────────────────────────────────────────

@admin_router.get("/queries")
async def admin_queries(limit: int = 50, authorization: str = Header(None)):
    await require_admin(authorization)
    try:
        col = await get_chat_transcripts_collection()
        docs = await col.find(
            {},
            {"_id": 0, "session_id": 1, "unit_code": 1, "query": 1, "user_id": 1, "user_email": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(limit).to_list(length=limit)
        # Stringify ObjectId if present
        for d in docs:
            for k, v in d.items():
                if hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict)):
                    d[k] = str(v)
        return {"queries": docs, "count": len(docs)}
    except Exception as e:
        logger.error(f"Admin queries error: {e}")
        return {"queries": [], "count": 0, "error": str(e)}


@admin_router.get("/exams")
async def admin_exams(limit: int = 30, authorization: str = Header(None)):
    await require_admin(authorization)
    try:
        col = await get_mock_exams_collection()
        docs = await col.find(
            {},
            {"_id": 0, "exam_id": 1, "unit_code": 1, "user_id": 1, "user_email": 1, "created_at": 1, "score": 1}
        ).sort("created_at", -1).limit(limit).to_list(length=limit)
        return {"exams": docs, "count": len(docs)}
    except Exception as e:
        return {"exams": [], "count": 0, "error": str(e)}


# ─── System Health ────────────────────────────────────────────────────────────

@admin_router.get("/health")
async def admin_health(authorization: str = Header(None)):
    await require_admin(authorization)
    import httpx
    checks = {}

    # Backend self
    checks["backend"] = {"status": "ok", "note": "This endpoint is responding"}

    # Supabase
    try:
        supabase = get_supabase_admin_client()
        supabase.table("units").select("id").limit(1).execute()
        checks["supabase"] = {"status": "ok"}
    except Exception as e:
        checks["supabase"] = {"status": "error", "detail": str(e)}

    # MongoDB
    try:
        col = await get_chat_transcripts_collection()
        await col.count_documents({})
        checks["mongodb"] = {"status": "ok"}
    except Exception as e:
        checks["mongodb"] = {"status": "error", "detail": str(e)}

    # Azure OpenAI (quick ping)
    try:
        from app.core.config import settings
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(settings.AZURE_OPENAI_ENDPOINT.rstrip("/").rsplit("/openai", 1)[0] + "/")
        checks["azure_openai"] = {"status": "reachable", "code": r.status_code}
    except Exception as e:
        checks["azure_openai"] = {"status": "error", "detail": str(e)}

    overall = "healthy" if all(v.get("status") in ("ok", "reachable") for v in checks.values()) else "degraded"
    return {"overall": overall, "checks": checks, "timestamp": datetime.now(timezone.utc).isoformat()}


# ─── Broadcasts ───────────────────────────────────────────────────────────────

@admin_router.get("/broadcasts")
async def admin_list_broadcasts(authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        resp = supabase.table("broadcasts").select("*").order("created_at", desc=True).limit(50).execute()
        return {"broadcasts": resp.data or []}
    except Exception as e:
        # Table may not exist yet — return empty gracefully
        return {"broadcasts": [], "note": str(e)}


@admin_router.post("/broadcasts")
async def admin_create_broadcast(body: BroadcastCreate, authorization: str = Header(None)):
    admin = await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        row = {
            "title": body.title,
            "body": body.body,
            "target": body.target,
            "created_by": admin["email"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
        resp = supabase.table("broadcasts").insert(row).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/broadcasts/{broadcast_id}")
async def admin_delete_broadcast(broadcast_id: str, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        supabase.table("broadcasts").delete().eq("id", broadcast_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Admin Audit Log ──────────────────────────────────────────────────────────

@admin_router.get("/audit-log")
async def admin_audit_log(limit: int = 50, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        resp = supabase.table("admin_audit_log").select("*").order("created_at", desc=True).limit(limit).execute()
        return {"logs": resp.data or []}
    except Exception as e:
        return {"logs": [], "note": str(e)}
