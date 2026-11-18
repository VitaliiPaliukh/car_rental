from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_rental_service, require_admin
from app.core.exceptions import BusinessRuleError, ForbiddenError
from app.models.enums import RentalStatus, UserRole
from app.models.rental import Rental
from app.models.user import User
from app.schemas.rental import (
    Quote,
    QuoteRequest,
    RentalCreate,
    RentalRead,
    ReturnRequest,
    ReturnResult,
)
from app.services.rental_service import RentalService

router = APIRouter(prefix="/api/rentals", tags=["rentals"])


def _ensure_access(user: User, rental: Rental) -> None:
    if user.role != UserRole.ADMIN and rental.client_id != user.client_id:
        raise ForbiddenError("This rental belongs to another client")


@router.get("/options")
def extra_options(service: RentalService = Depends(get_rental_service)):
    return service.extra_options()


@router.post("/quote", response_model=Quote)
def quote(data: QuoteRequest, service: RentalService = Depends(get_rental_service)):
    return service.quote(data)


@router.get("/my", response_model=list[RentalRead])
def my_rentals(
    user: User = Depends(get_current_user),
    service: RentalService = Depends(get_rental_service),
):
    if user.client_id is None:
        return []
    return service.list_rentals(client_id=user.client_id)


@router.post("", response_model=RentalRead, status_code=201)
def create_rental(
    data: RentalCreate,
    user: User = Depends(get_current_user),
    service: RentalService = Depends(get_rental_service),
):
    if user.role == UserRole.ADMIN:
        if data.client_id is None:
            raise BusinessRuleError("client_id is required when an admin creates a rental")
        client_id = data.client_id
    else:
        client_id = user.client_id
    return service.create_rental(data, client_id)


@router.get("/{rental_id}", response_model=RentalRead)
def get_rental(
    rental_id: int,
    user: User = Depends(get_current_user),
    service: RentalService = Depends(get_rental_service),
):
    rental = service.get_rental(rental_id)
    _ensure_access(user, rental)
    return rental


@router.post("/{rental_id}/cancel", response_model=RentalRead)
def cancel_rental(
    rental_id: int,
    user: User = Depends(get_current_user),
    service: RentalService = Depends(get_rental_service),
):
    _ensure_access(user, service.get_rental(rental_id))
    return service.cancel_rental(rental_id)


@router.get("", response_model=list[RentalRead], dependencies=[Depends(require_admin)])
def list_rentals(
    status: RentalStatus | None = None,
    client_id: int | None = None,
    car_id: int | None = None,
    service: RentalService = Depends(get_rental_service),
):
    return service.list_rentals(status, client_id, car_id)


@router.post("/{rental_id}/issue", response_model=RentalRead, dependencies=[Depends(require_admin)])
def issue_rental(rental_id: int, service: RentalService = Depends(get_rental_service)):
    return service.issue_rental(rental_id)


@router.post("/{rental_id}/return", response_model=ReturnResult, dependencies=[Depends(require_admin)])
def return_rental(
    rental_id: int, data: ReturnRequest, service: RentalService = Depends(get_rental_service)
):
    return service.return_rental(rental_id, data)