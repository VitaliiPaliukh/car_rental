from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import DamageLevel, RentalStatus


class _Period(BaseModel):
    issue_date: date
    expected_return_date: date

    @model_validator(mode="after")
    def check_dates(self):
        if self.expected_return_date <= self.issue_date:
            raise ValueError("expected_return_date must be later than issue_date")
        return self


class RentalCreate(_Period):
    client_id: int
    car_id: int
    options: list[str] = []


class QuoteRequest(_Period):
    car_id: int
    options: list[str] = []


class PriceLine(BaseModel):
    description: str
    amount: Decimal


class Quote(BaseModel):
    days: int
    lines: list[PriceLine]
    total: Decimal
    deposit: Decimal


class FineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reason: str
    amount: Decimal


class RentalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    car_id: int
    issue_date: date
    expected_return_date: date
    actual_return_date: date | None
    deposit_amount: Decimal
    total_cost: Decimal
    options: list[str]
    status: RentalStatus
    fines: list[FineRead] = []

    @field_validator("options", mode="before")
    @classmethod
    def split_options(cls, value):
        if isinstance(value, str):
            return [o for o in value.split(",") if o]
        return value


class ReturnRequest(BaseModel):
    return_date: date | None = None  # за замовчуванням - сьогодні
    damage: DamageLevel = DamageLevel.NONE
    is_clean: bool = True
    fuel_percent: int = Field(default=100, ge=0, le=100)


class ReturnResult(BaseModel):
    rental: RentalRead
    fines_total: Decimal
    deposit_refund: Decimal
    extra_to_pay: Decimal