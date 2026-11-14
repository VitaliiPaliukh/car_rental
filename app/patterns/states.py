from abc import ABC
from datetime import date

from app.core.exceptions import ConflictError, InvalidStateError
from app.models.enums import CarStatus, RentalStatus
from app.models.rental import Rental


class RentalState(ABC):
    status: RentalStatus

    def _forbidden(self, action: str):
        raise InvalidStateError(f"Cannot {action} a rental in state '{self.status.value}'")

    def issue(self, rental: Rental) -> None:
        self._forbidden("issue")

    def return_car(self, rental: Rental) -> None:
        self._forbidden("return")

    def cancel(self, rental: Rental) -> None:
        self._forbidden("cancel")

    def tick(self, rental: Rental, today: date) -> None:
        """Часова перевірка (перехід у Overdue)."""


class ReservedState(RentalState):
    status = RentalStatus.RESERVED

    def issue(self, rental: Rental) -> None:
        if rental.car.status != CarStatus.AVAILABLE:
            raise ConflictError(f"Car is not available (status: {rental.car.status.value})")
        rental.car.status = CarStatus.RENTED
        rental.status = RentalStatus.ACTIVE

    def cancel(self, rental: Rental) -> None:
        rental.status = RentalStatus.CANCELLED


class _ReturnableState(RentalState):
    def return_car(self, rental: Rental) -> None:
        rental.car.status = CarStatus.AVAILABLE
        rental.status = RentalStatus.CLOSED


class ActiveState(_ReturnableState):
    status = RentalStatus.ACTIVE

    def tick(self, rental: Rental, today: date) -> None:
        if today > rental.expected_return_date:
            rental.status = RentalStatus.OVERDUE


class OverdueState(_ReturnableState):
    status = RentalStatus.OVERDUE


class ClosedState(RentalState):
    status = RentalStatus.CLOSED


class CancelledState(RentalState):
    status = RentalStatus.CANCELLED


_STATES: dict[RentalStatus, RentalState] = {
    s.status: s
    for s in (ReservedState(), ActiveState(), OverdueState(), ClosedState(), CancelledState())
}


def get_state(rental: Rental) -> RentalState:
    return _STATES[rental.status]