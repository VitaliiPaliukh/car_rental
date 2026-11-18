"""Template Method: спільний скелет формування звітів.

generate() = fetch_data() -> aggregate() -> format().
Підкласи реалізують fetch_data() та aggregate(), format() можна перевизначити.
"""
from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal

from app.models.enums import CarStatus, RentalStatus
from app.models.rental import Rental
from app.patterns.pricing import money
from app.repositories.car_repository import CarRepository


class BaseReport(ABC):
    title: str

    def __init__(self, car_repo: CarRepository):
        self.car_repo = car_repo

    def generate(self, **params) -> dict:  # template method
        rows = self.fetch_data(**params)
        summary = self.aggregate(rows)
        return self.format(rows, summary, params)

    @abstractmethod
    def fetch_data(self, **params) -> list[dict]:
        ...

    @abstractmethod
    def aggregate(self, rows: list[dict]) -> dict:
        ...

    def format(self, rows: list[dict], summary: dict, params: dict) -> dict:
        return {"title": self.title, "params": params, "rows": rows, "summary": summary}


def _rented_days(rental: Rental) -> int:
    end = rental.actual_return_date or rental.expected_return_date
    return max(1, (end - rental.issue_date).days)


class AvailabilityReport(BaseReport):
    """Автомобілі в розрізі зайнятості."""

    title = "Car availability report"

    def fetch_data(self, **params) -> list[dict]:
        rows = []
        for car in self.car_repo.get_all():
            rentals = [r for r in car.rentals if r.status != RentalStatus.CANCELLED]
            rows.append(
                {
                    "car_id": car.id,
                    "car": f"{car.brand} {car.model} ({car.year})",
                    "status": car.status.value,
                    "total_rentals": len(rentals),
                    "days_rented": sum(_rented_days(r) for r in rentals),
                    "active_rentals": sum(
                        r.status in (RentalStatus.ACTIVE, RentalStatus.OVERDUE) for r in rentals
                    ),
                }
            )
        return rows

    def aggregate(self, rows: list[dict]) -> dict:
        count = lambda s: sum(r["status"] == s.value for r in rows)  # noqa: E731
        return {
            "total_cars": len(rows),
            "available": count(CarStatus.AVAILABLE),
            "rented": count(CarStatus.RENTED),
            "maintenance": count(CarStatus.MAINTENANCE),
        }


class FinancialReport(BaseReport):
    """Автомобілі в розрізі фінансових показників."""

    title = "Financial report"

    def fetch_data(self, date_from: date | None = None, date_to: date | None = None, **_) -> list[dict]:
        rows = []
        for car in self.car_repo.get_all():
            rent = Decimal("0")
            fines = Decimal("0")
            closed = 0
            held = Decimal("0")
            for r in car.rentals:
                if r.status == RentalStatus.CLOSED:
                    if date_from and r.actual_return_date < date_from:
                        continue
                    if date_to and r.actual_return_date > date_to:
                        continue
                    closed += 1
                    rent += r.total_cost
                    fines += sum((f.amount for f in r.fines), Decimal("0"))
                elif r.status in (RentalStatus.RESERVED, RentalStatus.ACTIVE, RentalStatus.OVERDUE):
                    held += r.deposit_amount
            rows.append(
                {
                    "car_id": car.id,
                    "car": f"{car.brand} {car.model} ({car.year})",
                    "closed_rentals": closed,
                    "rental_income": money(rent),
                    "fines_income": money(fines),
                    "total_income": money(rent + fines),
                    "deposits_held": money(held),
                }
            )
        return rows

    def aggregate(self, rows: list[dict]) -> dict:
        total = lambda key: money(sum((r[key] for r in rows), Decimal("0")))  # noqa: E731
        best = max(rows, key=lambda r: r["total_income"], default=None)
        return {
            "closed_rentals": sum(r["closed_rentals"] for r in rows),
            "rental_income": total("rental_income"),
            "fines_income": total("fines_income"),
            "total_income": total("total_income"),
            "deposits_held": total("deposits_held"),
            "top_car": best["car"] if best and best["total_income"] > 0 else None,
        }