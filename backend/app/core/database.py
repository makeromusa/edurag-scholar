from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Return anon/public Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("Supabase URL or Key not set. Returning dummy mock/none.")
        _supabase_client = create_client(
            settings.SUPABASE_URL or "https://placeholder.supabase.co",
            settings.SUPABASE_KEY or "placeholder-key"
        )
    return _supabase_client


def get_supabase_admin_client() -> Client:
    """Return service-role Supabase client for backend operations."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY or "placeholder-key"
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL or "https://placeholder.supabase.co",
            key
        )
    return _supabase_admin_client


async def match_unit_chunks_rpc(
    unit_code: str,
    query_embedding: List[float],
    match_threshold: float = 0.65,
    match_count: int = 6
) -> List[Dict[str, Any]]:
    """
    Invoke the match_unit_chunks PostgreSQL function for unit-isolated vector search.
    """
    client = get_supabase_admin_client()
    try:
        response = client.rpc(
            "match_unit_chunks",
            {
                "p_unit_code": unit_code,
                "query_embedding": query_embedding,
                "match_threshold": match_threshold,
                "match_count": match_count
            }
        ).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error executing match_unit_chunks RPC: {e}")
        return []
