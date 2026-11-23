from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Car Rental"
    database_url: str = f"sqlite:///{(BASE_DIR / 'rental.db').as_posix()}"
    secret_key: str = "dev-secret-change-me-in-env-file-0000"
    access_token_expire_minutes: int = 480
    upload_dir: str = str(BASE_DIR / "uploads")
    max_photo_bytes: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")


@lru_cache
def get_settings() -> Settings:
    """Singleton: один екземпляр налаштувань на весь застосунок."""
    return Settings()