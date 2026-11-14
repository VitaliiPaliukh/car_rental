from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from app.models.enums import DamageLevel
from app.models.rental import Rental
from app.patterns.pricing import money

LATE_RATE = Decimal("1.5")            # прострочена доба = 150% добової ціни
MINOR_DAMAGE_SHARE = Decimal("0.15")  # частка застави
MAJOR_DAMAGE_SHARE = Decimal("1.00")
DIRTY_FINE = Decimal("20.00")
LOW_FUEL_LIMIT = 25                   # %
LOW_FUEL_FINE = Decimal("15.00")


@dataclass
class ReturnContext:
    rental: Rental
    return_date: date
    damage: DamageLevel
    is_clean: bool
    fuel_percent: int


@dataclass
class FineDraft:
    reason: str
    amount: Decimal


class ReturnCheckHandler(ABC):
    def __init__(self):
        self._next: ReturnCheckHandler | None = None

    def set_next(self, handler: "ReturnCheckHandler") -> "ReturnCheckHandler":
        self._next = handler
        return handler

    def handle(self, ctx: ReturnContext) -> list[FineDraft]:
        fines = self.check(ctx)
        if self._next:
            fines += self._next.handle(ctx)
        return fines

    @abstractmethod
    def check(self, ctx: ReturnContext) -> list[FineDraft]:
        ...


class OverdueCheck(ReturnCheckHandler):
    def check(self, ctx: ReturnContext) -> list[FineDraft]:
        late_days = (ctx.return_date - ctx.rental.expected_return_date).days
        if late_days <= 0:
            return []
        amount = money(ctx.rental.car.price_per_day * LATE_RATE * late_days)
        return [FineDraft(f"Late return: {late_days} day(s)", amount)]


class DamageCheck(ReturnCheckHandler):
    def check(self, ctx: ReturnContext) -> list[FineDraft]:
        deposit = ctx.rental.deposit_amount
        if ctx.damage == DamageLevel.MINOR:
            return [FineDraft("Minor damage", money(deposit * MINOR_DAMAGE_SHARE))]
        if ctx.damage == DamageLevel.MAJOR:
            return [FineDraft("Major damage", money(deposit * MAJOR_DAMAGE_SHARE))]
        return []


class CleanlinessCheck(ReturnCheckHandler):
    def check(self, ctx: ReturnContext) -> list[FineDraft]:
        return [] if ctx.is_clean else [FineDraft("Car returned dirty", DIRTY_FINE)]


class FuelCheck(ReturnCheckHandler):
    def check(self, ctx: ReturnContext) -> list[FineDraft]:
        if ctx.fuel_percent < LOW_FUEL_LIMIT:
            return [FineDraft(f"Low fuel ({ctx.fuel_percent}%)", LOW_FUEL_FINE)]
        return []


def build_return_chain() -> ReturnCheckHandler:
    head = OverdueCheck()
    head.set_next(DamageCheck()).set_next(CleanlinessCheck()).set_next(FuelCheck())
    return head