import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
from app.core.config import settings
from app.api.routes import router as api_router
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

# CORS Middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix="/api")


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
