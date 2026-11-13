from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CarStatus, CarType


class CarCreate(BaseModel):
    brand: str
    model: str
    type: CarType
    year: int = Field(ge=1990, le=2100)
    price_per_day: Decimal = Field(gt=0)
    deposit: Decimal = Field(ge=0)


class CarUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    type: CarType | None = None
    year: int | None = Field(default=None, ge=1990, le=2100)
    price_per_day: Decimal | None = Field(default=None, gt=0)
    deposit: Decimal | None = Field(default=None, ge=0)
    status: CarStatus | None = None


class CarRead(CarCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: CarStatus