from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CarStatus
from app.repositories.car_repository import CarRepository
from app.schemas.car import CarCreate, CarRead, CarUpdate
from app.services.car_service import CarService

router = APIRouter(prefix="/api/cars", tags=["cars"])


def get_car_service(db: Session = Depends(get_db)) -> CarService:
    return CarService(CarRepository(db))


@router.get("", response_model=list[CarRead])
def list_cars(status: CarStatus | None = None, service: CarService = Depends(get_car_service)):
    return service.list_cars(status)


@router.get("/{car_id}", response_model=CarRead)
def get_car(car_id: int, service: CarService = Depends(get_car_service)):
    return service.get_car(car_id)


@router.post("", response_model=CarRead, status_code=201)
def create_car(data: CarCreate, service: CarService = Depends(get_car_service)):
    return service.create_car(data)


@router.patch("/{car_id}", response_model=CarRead)
def update_car(car_id: int, data: CarUpdate, service: CarService = Depends(get_car_service)):
    return service.update_car(car_id, data)


@router.delete("/{car_id}", status_code=204)
def delete_car(car_id: int, service: CarService = Depends(get_car_service)):
    service.delete_car(car_id)