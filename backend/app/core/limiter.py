import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)


def get_real_ip(request: Request) -> str:
    """
    Extracts the client's actual public IP address.
    Prioritizes standard reverse-proxy headers (X-Forwarded-For, CF-Connecting-IP, X-Real-IP)
    used by Azure App Service, Vercel, and Cloudflare.
    """
    # 1. Cloudflare header
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    # 2. Standard proxy header (comma-separated list: client, proxy1, proxy2)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # 3. Nginx / Azure X-Real-IP
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # 4. Fallback to direct client host
    client = request.client
    return client.host if client else "127.0.0.1"


# Global application limiter
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=["120/minute"],
    headers_enabled=True
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Returns an RFC 7807 compliant HTTP 429 response when rate limit is exceeded.
    """
    client_ip = get_real_ip(request)
    logger.warning(f"Rate limit exceeded for client {client_ip} on {request.method} {request.url.path}: {exc.detail}")
    
    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please wait a moment before sending more queries.",
            "detail": str(exc.detail),
            "client_ip": client_ip
        },
        headers={
            "Retry-After": "60",
            "X-RateLimit-Exceeded": "true"
        }
    )
