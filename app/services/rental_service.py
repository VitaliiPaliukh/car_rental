from datetime import date
from decimal import Decimal

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.enums import CarStatus, RentalStatus
from app.models.fine import Fine
from app.models.rental import Rental
from app.patterns.pricing import EXTRA_OPTIONS, build_price, money
from app.patterns.return_checks import ReturnContext, build_return_chain
from app.patterns.states import get_state
from app.repositories.car_repository import CarRepository
from app.repositories.client_repository import ClientRepository
from app.repositories.rental_repository import RentalRepository
from app.schemas.rental import (
    PriceLine,
    Quote,
    QuoteRequest,
    RentalCreate,
    ReturnRequest,
)


class RentalService:
    def __init__(
        self,
        rentals: RentalRepository,
        cars: CarRepository,
        clients: ClientRepository,
    ):
        self.rentals = rentals
        self.cars = cars
        self.clients = clients

    def list_rentals(self, status=None, client_id=None, car_id=None) -> list[Rental]:
        self.refresh_overdue()
        return self.rentals.get_all(status, client_id, car_id)

    def get_rental(self, rental_id: int) -> Rental:
        rental = self.rentals.get(rental_id)
        if rental is None:
            raise NotFoundError(f"Rental {rental_id} not found")
        self._sync_overdue(rental)
        return rental

    def quote(self, data: QuoteRequest) -> Quote:
        car = self.cars.get(data.car_id)
        if car is None:
            raise NotFoundError(f"Car {data.car_id} not found")
        days = (data.expected_return_date - data.issue_date).days
        price = build_price(car, days, data.options)  # Strategy + Decorator
        return Quote(
            days=days,
            lines=[PriceLine(description=d, amount=a) for d, a in price.breakdown()],
            total=price.cost(),
            deposit=car.deposit,
        )

    @staticmethod
    def extra_options() -> dict[str, Decimal]:
        return EXTRA_OPTIONS

    def create_rental(self, data: RentalCreate) -> Rental:
        client = self.clients.get(data.client_id)
        if client is None:
            raise NotFoundError(f"Client {data.client_id} not found")
        car = self.cars.get(data.car_id)
        if car is None:
            raise NotFoundError(f"Car {data.car_id} not found")
        if car.status == CarStatus.MAINTENANCE:
            raise BusinessRuleError("Car is under maintenance")
        if self.rentals.has_overlap(car.id, data.issue_date, data.expected_return_date):
            raise ConflictError("Car is already booked for these dates")

        days = (data.expected_return_date - data.issue_date).days
        price = build_price(car, days, data.options)
        rental = Rental(
            client_id=client.id,
            car_id=car.id,
            issue_date=data.issue_date,
            expected_return_date=data.expected_return_date,
            deposit_amount=car.deposit,
            total_cost=price.cost(),
            options=",".join(dict.fromkeys(data.options)),
            status=RentalStatus.RESERVED,
        )
        return self.rentals.add(rental)

    def issue_rental(self, rental_id: int) -> Rental:
        rental = self.get_rental(rental_id)
        get_state(rental).issue(rental)  # State
        return self.rentals.save(rental)

    def cancel_rental(self, rental_id: int) -> Rental:
        rental = self.get_rental(rental_id)
        get_state(rental).cancel(rental)
        return self.rentals.save(rental)

    def return_rental(self, rental_id: int, data: ReturnRequest) -> dict:
        rental = self.get_rental(rental_id)
        return_date = data.return_date or date.today()
        if return_date < rental.issue_date:
            raise BusinessRuleError("return_date cannot be earlier than issue_date")

        state = get_state(rental)
        if rental.status not in (RentalStatus.ACTIVE, RentalStatus.OVERDUE):
            state.return_car(rental)
        ctx = ReturnContext(
            rental=rental,
            return_date=return_date,
            damage=data.damage,
            is_clean=data.is_clean,
            fuel_percent=data.fuel_percent,
        )
        drafts = build_return_chain().handle(ctx)  # Chain of Responsibility
        for d in drafts:
            rental.fines.append(Fine(reason=d.reason, amount=d.amount))

        rental.actual_return_date = return_date
        state.return_car(rental)
        self.rentals.save(rental)

        fines_total = money(sum((d.amount for d in drafts), Decimal("0")))
        deposit = rental.deposit_amount
        return {
            "rental": rental,
            "fines_total": fines_total,
            "deposit_refund": money(max(Decimal("0"), deposit - fines_total)),
            "extra_to_pay": money(max(Decimal("0"), fines_total - deposit)),
        }

    def _sync_overdue(self, rental: Rental) -> None:
        before = rental.status
        get_state(rental).tick(rental, date.today())
        if rental.status != before:
            self.rentals.save(rental)

    def refresh_overdue(self) -> None:
        for rental in self.rentals.list_active():
            self._sync_overdue(rental)