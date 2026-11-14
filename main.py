from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app import models
from app.api import cars, clients, rentals
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.include_router(cars.router)
app.include_router(clients.router)
app.include_router(rentals.router)


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(BusinessRuleError)
async def business_rule_handler(request: Request, exc: BusinessRuleError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.get("/api/health")
def health():
    return {"status": "ok"}