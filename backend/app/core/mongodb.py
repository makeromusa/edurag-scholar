import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_db: Optional[AsyncIOMotorDatabase] = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        if not settings.MONGODB_URI:
            logger.warning("MONGODB_URI is not set.")
        _mongo_client = AsyncIOMotorClient(
            settings.MONGODB_URI or "mongodb://localhost:27017",
            serverSelectionTimeoutMS=5000
        )
    return _mongo_client


def get_mongo_db() -> AsyncIOMotorDatabase:
    global _mongo_db
    if _mongo_db is None:
        client = get_mongo_client()
        _mongo_db = client[settings.MONGODB_DB_NAME]
    return _mongo_db


# Named collection helpers for EduRAG polyglot storage
def get_chat_transcripts_collection():
    return get_mongo_db()["chat_transcripts"]


def get_mock_exams_collection():
    return get_mongo_db()["mock_exams"]


def get_flashcards_collection():
    return get_mongo_db()["flashcards"]


def get_briefing_archives_collection():
    return get_mongo_db()["briefing_archives"]
