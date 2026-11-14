from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.car_repository import CarRepository
from app.repositories.client_repository import ClientRepository
from app.repositories.rental_repository import RentalRepository
from app.services.car_service import CarService
from app.services.client_service import ClientService


def get_car_service(db: Session = Depends(get_db)) -> CarService:
    return CarService(CarRepository(db), RentalRepository(db))


def get_client_service(db: Session = Depends(get_db)) -> ClientService:
    return ClientService(ClientRepository(db))