from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401
from app.core.config import get_settings
from app.core.database import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"status": "ok"}