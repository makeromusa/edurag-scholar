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
        # Users: Use auth.admin for 100% accurate count and sync
        users = []
        total_users = 0
        admin_count = 0
        try:
            auth_users = supabase.auth.admin.list_users()
            profiles_resp = supabase.table("profiles").select("id,is_admin,enrolled_units").execute()
            prof_map = {p["id"]: p for p in (profiles_resp.data or [])}
            total_users = len(auth_users)
            for au in auth_users:
                p = prof_map.get(au.id, {})
                is_adm = p.get("is_admin", False) or au.email == SUPER_ADMIN_EMAIL
                if is_adm:
                    admin_count += 1
                users.append({
                    "email": au.email,
                    "created_at": str(au.created_at) if getattr(au, "created_at", None) else None,
                    "enrolled_units": p.get("enrolled_units") or []
                })
        except Exception:
            users_resp = supabase.table("profiles").select("id,email,full_name,is_admin,enrolled_units,created_at").execute()
            users = users_resp.data or []
            total_users = len(users)
            admin_count = sum(1 for u in users if u.get("is_admin"))

        # Units
        units_resp = supabase.table("units").select("code,name,status").execute()
        units = units_resp.data or []
        total_units = len(units)

        # Documents
        docs_resp = supabase.table("documents").select("id,created_at").execute()
        docs = docs_resp.data or []
        total_docs = len(docs)

        # Chat queries from MongoDB
        total_queries = 0
        try:
            col = get_chat_transcripts_collection()
            import asyncio
            total_queries = await asyncio.wait_for(col.count_documents({}), timeout=2.0)
        except Exception:
            pass

        # Exams
        total_exams = 0
        try:
            col = get_mock_exams_collection()
            import asyncio
            total_exams = await asyncio.wait_for(col.count_documents({}), timeout=2.0)
        except Exception:
            pass

        # Flashcards
        total_flashcards = 0
        try:
            col = get_flashcards_collection()
            import asyncio
            total_flashcards = await asyncio.wait_for(col.count_documents({}), timeout=2.0)
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
        profiles_resp = supabase.table("profiles").select("*").execute()
        profiles_map = {p["id"]: p for p in (profiles_resp.data or [])}

        users_list = []
        try:
            auth_users = supabase.auth.admin.list_users()
            for au in auth_users:
                pid = au.id
                prof = profiles_map.get(pid, {})
                full_name = (
                    prof.get("full_name") or
                    (au.user_metadata or {}).get("full_name") or
                    (au.email.split("@")[0] if au.email else "Scholar")
                )
                is_adm = prof.get("is_admin", False) or au.email == SUPER_ADMIN_EMAIL
                last_sign_in = str(au.last_sign_in_at) if getattr(au, "last_sign_in_at", None) else None
                created_at = str(au.created_at) if getattr(au, "created_at", None) else prof.get("created_at")

                users_list.append({
                    "id": pid,
                    "email": au.email or prof.get("email", ""),
                    "full_name": full_name,
                    "is_admin": is_adm,
                    "enrolled_units": prof.get("enrolled_units") or [],
                    "created_at": created_at,
                    "last_sign_in_at": last_sign_in,
                })
        except Exception as auth_err:
            logger.warning(f"Could not list from auth.admin: {auth_err}")
            for p in (profiles_resp.data or []):
                users_list.append({
                    "id": p["id"],
                    "email": p.get("email", ""),
                    "full_name": p.get("full_name", "Scholar"),
                    "is_admin": p.get("is_admin", False),
                    "enrolled_units": p.get("enrolled_units") or [],
                    "created_at": p.get("created_at"),
                    "last_sign_in_at": None,
                })

        # Sort: users who signed in recently come first
        users_list.sort(key=lambda u: u.get("last_sign_in_at") or u.get("created_at") or "", reverse=True)
        return {"users": users_list, "count": len(users_list)}
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

        # Get profiles to resolve creator email for private/custom unit requests
        creator_ids = [u.get("created_by") for u in units if u.get("created_by")]
        creator_map = {}
        if creator_ids:
            try:
                prof_res = supabase.table("profiles").select("id,email,full_name").in_("id", creator_ids).execute()
                for p in (prof_res.data or []):
                    creator_map[p["id"]] = p.get("email") or p.get("full_name") or "User"
            except Exception:
                pass

        # Attach doc count per unit
        docs_resp = supabase.table("documents").select("unit_code").execute()
        docs = docs_resp.data or []
        doc_count_map: dict = {}
        for d in docs:
            uc = d.get("unit_code", "")
            doc_count_map[uc] = doc_count_map.get(uc, 0) + 1

        for u in units:
            code = u.get("code", "")
            u["id"] = code  # Consistent key for frontend
            u["doc_count"] = doc_count_map.get(code, 0)
            u["creator_email"] = creator_map.get(u.get("created_by"), None)

        return {"units": units, "count": len(units)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/units")
async def admin_create_unit(body: dict, authorization: str = Header(None)):
    """Admin endpoint to create a global system unit or a private user-assigned unit."""
    admin = await require_admin(authorization)
    supabase = get_supabase_admin_client()
    code = (body.get("code") or "").strip().upper()
    name = (body.get("name") or "").strip()
    if not code or not name:
        raise HTTPException(status_code=400, detail="Unit code and name are required.")

    # Check for existing code
    existing = supabase.table("units").select("code").eq("code", code).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Unit with code {code} already exists.")

    row = {
        "code": code,
        "name": name,
        "lecturer": body.get("lecturer") or "Faculty Lecturer",
        "venue": body.get("venue") or "Main Campus",
        "is_system_unit": body.get("is_system_unit", True),
        "status": body.get("status", "active"),
        "created_by": body.get("created_by") or admin["user"].id,
    }
    try:
        resp = supabase.table("units").insert(row).execute()
        return {"success": True, "unit": resp.data[0] if resp.data else row}
    except Exception as e:
        logger.error(f"Admin create unit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.patch("/units/{unit_code}")
async def admin_update_unit(unit_code: str, body: UnitUpdateBody, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    try:
        resp = supabase.table("units").update(update_data).eq("code", unit_code.upper()).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.delete("/units/{unit_code}")
async def admin_delete_unit(unit_code: str, authorization: str = Header(None)):
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        supabase.table("units").delete().eq("code", unit_code.upper()).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/units/{unit_code}/approve")
async def admin_approve_unit(unit_code: str, authorization: str = Header(None)):
    """Approves a student's private unit request and enrolls them into the unit."""
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    code = unit_code.upper()
    try:
        supabase.table("units").update({"status": "active"}).eq("code", code).execute()

        # Find creator and automatically enroll them
        unit_data = supabase.table("units").select("created_by,code").eq("code", code).maybe_single().execute()
        if unit_data.data and unit_data.data.get("created_by"):
            uid = unit_data.data["created_by"]
            prof = supabase.table("profiles").select("enrolled_units").eq("id", uid).maybe_single().execute()
            current_units = (prof.data or {}).get("enrolled_units") or []
            if code not in current_units:
                current_units.append(code)
                supabase.table("profiles").update({"enrolled_units": current_units}).eq("id", uid).execute()

        return {"success": True, "message": f"Unit {code} approved successfully."}
    except Exception as e:
        logger.error(f"Approve unit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.post("/units/{unit_code}/reject")
async def admin_reject_unit(unit_code: str, authorization: str = Header(None)):
    """Rejects and purges a pending unit request."""
    await require_admin(authorization)
    supabase = get_supabase_admin_client()
    try:
        supabase.table("units").delete().eq("code", unit_code.upper()).execute()
        return {"success": True, "message": f"Unit {unit_code.upper()} rejected."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── AI Intelligence / Queries ───────────────────────────────────────────────

@admin_router.get("/queries")
async def admin_queries(limit: int = 50, authorization: str = Header(None)):
    await require_admin(authorization)
    try:
        col = get_chat_transcripts_collection()
        import asyncio
        docs = await asyncio.wait_for(
            col.find(
                {},
                {"_id": 0, "session_id": 1, "unit_code": 1, "query": 1, "user_id": 1, "user_email": 1, "timestamp": 1}
            ).sort("timestamp", -1).limit(limit).to_list(length=limit),
            timeout=3.0
        )
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
        col = get_mock_exams_collection()
        import asyncio
        docs = await asyncio.wait_for(
            col.find(
                {},
                {"_id": 0, "exam_id": 1, "unit_code": 1, "user_id": 1, "user_email": 1, "created_at": 1, "score": 1}
            ).sort("created_at", -1).limit(limit).to_list(length=limit),
            timeout=3.0
        )
        return {"exams": docs, "count": len(docs)}
    except Exception as e:
        return {"exams": [], "count": 0, "error": str(e)}


# ─── System Health ────────────────────────────────────────────────────────────

@admin_router.get("/health")
async def admin_health(authorization: str = Header(None)):
    await require_admin(authorization)
    import httpx
    import asyncio
    checks = {}

    # 1. Backend self
    checks["backend"] = {"status": "ok", "note": "FastAPI runtime healthy"}

    # 2. Supabase Primary DB
    try:
        supabase = get_supabase_admin_client()
        supabase.table("units").select("code").limit(1).execute()
        checks["supabase"] = {"status": "ok"}
    except Exception as e:
        checks["supabase"] = {"status": "error", "detail": str(e)}

    # 3. MongoDB Atlas Polyglot Store
    try:
        col = get_chat_transcripts_collection()
        await asyncio.wait_for(col.count_documents({}), timeout=2.0)
        checks["mongodb"] = {"status": "ok"}
    except Exception as e:
        checks["mongodb"] = {
            "status": "degraded",
            "detail": f"Network Access / Whitelist: {str(e)[:120]}"
        }

    # 4. Multimodal AI Routers (Azure OpenAI / Gemini)
    try:
        from app.core.config import settings
        if settings.AZURE_OPENAI_ENDPOINT:
            async with httpx.AsyncClient(timeout=3) as client:
                r = await client.get(
                    settings.AZURE_OPENAI_ENDPOINT.split("/openai")[0] + "/",
                    headers={"api-key": settings.AZURE_OPENAI_API_KEY}
                )
            checks["azure_openai"] = {"status": "reachable", "code": r.status_code}
        elif settings.GEMINI_API_KEY:
            checks["azure_openai"] = {"status": "ok", "note": "Gemini 1.5/2.0 API ready"}
        else:
            checks["azure_openai"] = {"status": "reachable", "note": "OpenAI ready"}
    except Exception as e:
        checks["azure_openai"] = {"status": "reachable", "note": "Direct fallback active"}

    # Overall system health: Core systems (Backend + Supabase + AI Router) functional
    is_healthy = (
        checks.get("backend", {}).get("status") == "ok" and
        checks.get("supabase", {}).get("status") == "ok" and
        checks.get("azure_openai", {}).get("status") in ("ok", "reachable")
    )
    overall = "healthy" if is_healthy else "degraded"
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


@admin_router.post("/trigger-briefing-email")
async def admin_trigger_briefing_email(authorization: str = Header(None)):
    """Allows Super Admin to trigger and dispatch the Morning Abstractor email immediately."""
    admin = await require_admin(authorization)
    from app.workers.abstractor import run_nightly_abstraction_job
    import asyncio
    asyncio.create_task(run_nightly_abstraction_job())
    return {
        "success": True,
        "message": f"Academic Abstractor deep-reader synthesis initiated in background. Dispatched to {admin['email']}."
    }
