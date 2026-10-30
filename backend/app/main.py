import logging
import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk

# Resilient IPv4 routing for Windows / hybrid network environments
try:
    _orig_getaddrinfo = socket.getaddrinfo
    def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        if host in ("testserver", "localhost", "127.0.0.1"):
            return _orig_getaddrinfo(host, port, family, type, proto, flags)
        return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
    socket.getaddrinfo = _ipv4_getaddrinfo
except Exception:
    pass
from app.core.config import settings
from app.core.limiter import limiter, custom_rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.routes import router as api_router
from app.routers.document_pipeline import router as pipeline_router
from app.workers.abstractor import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("edurag")

# Optional Sentry Monitoring
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        environment=settings.ENVIRONMENT
    )
    logger.info("Sentry monitoring initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch 3 AM background cron abstractor
    logger.info("Initializing EduRAG Scholar application...")
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f"Could not start background scheduler: {e}")
    yield
    # Shutdown
    logger.info("Shutting down EduRAG Scholar...")


app = FastAPI(
    title="EduRAG Scholar API",
    description="Autonomous 7-Unit RAG & Web-Agent Scholar for University of Nairobi (Chiromo)",
    version="1.0.0",
    lifespan=lifespan
)

# Application Security: Wire Global SlowAPI Limiter and Custom Error Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

# CORS Middleware for Next.js frontend communication (Localhost & Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://learningassistant-chi.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix="/api")
app.include_router(pipeline_router)


@app.get("/")
def root():
    return {
        "message": "EduRAG Scholar Backend is running.",
        "documentation": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
