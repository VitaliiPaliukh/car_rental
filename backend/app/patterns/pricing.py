from abc import ABC, abstractmethod
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from app.core.exceptions import BusinessRuleError
from app.models.car import Car


def money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ============================== Strategy ==============================
class PricingStrategy(ABC):
    name: str

    @abstractmethod
    def calculate(self, price_per_day: Decimal, days: int) -> Decimal:
        ...


class DailyTariff(PricingStrategy):
    name = "daily tariff"

    def calculate(self, price_per_day: Decimal, days: int) -> Decimal:
        return money(price_per_day * days)


class WeeklyTariff(PricingStrategy):
    name = "weekly tariff (-10%)"

    def calculate(self, price_per_day: Decimal, days: int) -> Decimal:
        return money(price_per_day * days * Decimal("0.90"))


class MonthlyTariff(PricingStrategy):
    name = "monthly tariff (-20%)"

    def calculate(self, price_per_day: Decimal, days: int) -> Decimal:
        return money(price_per_day * days * Decimal("0.80"))


def select_tariff(days: int) -> PricingStrategy:
    if days >= 30:
        return MonthlyTariff()
    if days >= 7:
        return WeeklyTariff()
    return DailyTariff()


class PriceComponent(ABC):
    @abstractmethod
    def cost(self) -> Decimal:
        ...

    @abstractmethod
    def breakdown(self) -> list[tuple[str, Decimal]]:
        """Рядки розрахунку: сума всіх рядків дорівнює cost()."""


class BasePrice(PriceComponent):
    def __init__(self, price_per_day: Decimal, days: int, strategy: PricingStrategy):
        self.price_per_day = price_per_day
        self.days = days
        self.strategy = strategy

    def cost(self) -> Decimal:
        return self.strategy.calculate(self.price_per_day, self.days)

    def breakdown(self) -> list[tuple[str, Decimal]]:
        label = f"Rental: {self.days} day(s) x {self.price_per_day} ({self.strategy.name})"
        return [(label, self.cost())]


class PriceDecorator(PriceComponent, ABC):
    def __init__(self, wrapped: PriceComponent):
        self.wrapped = wrapped


YEAR_RULES: list[tuple[int, Decimal, str]] = [
    (1, Decimal("1.20"), "New car surcharge (+20%)"),
    (5, Decimal("1.00"), "Standard age (no adjustment)"),
    (10, Decimal("0.90"), "Older car discount (-10%)"),
    (999, Decimal("0.80"), "Old car discount (-20%)"),
]


class YearCoefficientDecorator(PriceDecorator):
    def __init__(self, wrapped: PriceComponent, car_year: int, current_year: int | None = None):
        super().__init__(wrapped)
        age = (current_year or date.today().year) - car_year
        for max_age, coef, label in YEAR_RULES:
            if age <= max_age:
                self.coef, self.label = coef, label
                break

    def cost(self) -> Decimal:
        return money(self.wrapped.cost() * self.coef)

    def breakdown(self) -> list[tuple[str, Decimal]]:
        delta = self.cost() - self.wrapped.cost()
        return self.wrapped.breakdown() + [(self.label, delta)]


EXTRA_OPTIONS: dict[str, Decimal] = {
    "insurance": Decimal("8.00"),
    "gps": Decimal("3.00"),
    "child_seat": Decimal("2.00"),
}


class ExtraOptionDecorator(PriceDecorator):
    def __init__(self, wrapped: PriceComponent, option: str, days: int):
        super().__init__(wrapped)
        if option not in EXTRA_OPTIONS:
            raise BusinessRuleError(
                f"Unknown option '{option}'. Available: {', '.join(EXTRA_OPTIONS)}"
            )
        self.option = option
        self.extra = money(EXTRA_OPTIONS[option] * days)

    def cost(self) -> Decimal:
        return money(self.wrapped.cost() + self.extra)

    def breakdown(self) -> list[tuple[str, Decimal]]:
        return self.wrapped.breakdown() + [(f"Option: {self.option}", self.extra)]


def build_price(
    car: Car, days: int, options: list[str] | None = None, current_year: int | None = None
) -> PriceComponent:
    """Збирає ланцюжок: Strategy -> BasePrice -> Year decorator -> Option decorators."""
    component: PriceComponent = BasePrice(car.price_per_day, days, select_tariff(days))
    component = YearCoefficientDecorator(component, car.year, current_year)
    for option in dict.fromkeys(options or []):
        component = ExtraOptionDecorator(component, option, days)
    return component
