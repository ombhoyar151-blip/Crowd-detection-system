"""Configuration settings for the CrowdSense backend."""
from pathlib import Path
from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "CrowdSense API"
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'crowdsense.db'}"
    cors_origins: str = "*"
    model_name: str = "yolov8n.pt"
    low_threshold: int = 5
    medium_threshold: int = 20
    confidence_threshold: float = 0.25

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "uploads").mkdir(exist_ok=True)
