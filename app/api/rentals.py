from fastapi import APIRouter, Depends

from app.api.deps import get_rental_service
from app.models.enums import RentalStatus
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


@router.get("/options")
def extra_options(service: RentalService = Depends(get_rental_service)):
    return service.extra_options()


@router.post("/quote", response_model=Quote)
def quote(data: QuoteRequest, service: RentalService = Depends(get_rental_service)):
    return service.quote(data)


@router.get("", response_model=list[RentalRead])
def list_rentals(
    status: RentalStatus | None = None,
    client_id: int | None = None,
    car_id: int | None = None,
    service: RentalService = Depends(get_rental_service),
):
    return service.list_rentals(status, client_id, car_id)


@router.get("/{rental_id}", response_model=RentalRead)
def get_rental(rental_id: int, service: RentalService = Depends(get_rental_service)):
    return service.get_rental(rental_id)


@router.post("", response_model=RentalRead, status_code=201)
def create_rental(data: RentalCreate, service: RentalService = Depends(get_rental_service)):
    return service.create_rental(data)


@router.post("/{rental_id}/issue", response_model=RentalRead)
def issue_rental(rental_id: int, service: RentalService = Depends(get_rental_service)):
    return service.issue_rental(rental_id)


@router.post("/{rental_id}/return", response_model=ReturnResult)
def return_rental(
    rental_id: int, data: ReturnRequest, service: RentalService = Depends(get_rental_service)
):
    return service.return_rental(rental_id, data)


@router.post("/{rental_id}/cancel", response_model=RentalRead)
def cancel_rental(rental_id: int, service: RentalService = Depends(get_rental_service)):
    return service.cancel_rental(rental_id)