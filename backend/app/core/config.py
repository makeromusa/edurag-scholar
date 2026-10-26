from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET_NAME: str = "course-materials"

    # MongoDB Atlas
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "edurag"

    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-08-01-preview"
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = "gpt-4o-mini"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = "text-embedding-3-small"

    # Fallback Direct OpenAI
    OPENAI_API_KEY: str = ""

    # Google Gemini API
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-latest"

    # Tavily Search API
    TAVILY_API_KEY: str = ""

    # SendGrid & Abstractor
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "scholar@edurag.internal"
    STUDENT_ALERT_EMAIL: str = "asmanmakero@gmail.com"
    ABSTRACT_CRON_HOUR: int = 3
    ABSTRACT_CRON_MINUTE: int = 0
    TIMEZONE: str = "Africa/Nairobi"

    # Sentry
    SENTRY_DSN: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
