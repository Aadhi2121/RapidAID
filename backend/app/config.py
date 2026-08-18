import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database (PostgreSQL with SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civicai.db")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "civicai-super-secret-key-production-ready-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo
    
    # AI Engine Mode: "real" or "mock"
    AI_MODE: str = os.getenv("AI_MODE", "real")
    
    # Optional LLM API Key
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY", None)
    
    # Geo Defaults (Chennai, India)
    DEFAULT_LAT: float = 13.0827
    DEFAULT_LNG: float = 80.2707

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
