from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Car Rental"
    database_url: str = "sqlite:///./rental.db"
    secret_key: str = "dev-secret-change-me-in-env-file-0000"
    access_token_expire_minutes: int = 480

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_settings() -> Settings:
    """Singleton: один екземпляр налаштувань на весь застосунок."""
    return Settings()