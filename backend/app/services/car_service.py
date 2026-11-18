from datetime import date

from app.core.exceptions import ConflictError, NotFoundError
from app.models.car import Car
from app.models.enums import CarStatus, CarType
from app.patterns.factories import get_factory
from app.repositories.car_repository import CarRepository
from app.repositories.rental_repository import RentalRepository
from app.schemas.car import CarCreate, CarUpdate


class CarService:
    def __init__(self, repo: CarRepository, rental_repo: RentalRepository):
        self.repo = repo
        self.rental_repo = rental_repo

    def list_cars(self, status: CarStatus | None = None, car_type: CarType | None = None) -> list[Car]:
        return self.repo.get_all(status, car_type)

    def available_cars(self, start: date, end: date) -> list[Car]:
        """Авто, вільні на період [start, end): не в ремонті й без перетину з орендами."""
        return [
            c
            for c in self.repo.get_all()
            if c.status != CarStatus.MAINTENANCE and not self.rental_repo.has_overlap(c.id, start, end)
        ]

    def get_car(self, car_id: int) -> Car:
        car = self.repo.get(car_id)
        if car is None:
            raise NotFoundError(f"Car {car_id} not found")
        return car

    def create_car(self, data: CarCreate) -> Car:
        return self.repo.add(get_factory(data.type).create(data))  # Factory Method

    def update_car(self, car_id: int, data: CarUpdate) -> Car:
        car = self.get_car(car_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(car, field, value)
        return self.repo.save(car)

    def delete_car(self, car_id: int) -> None:
        car = self.get_car(car_id)
        if car.rentals:
            raise ConflictError("Cannot delete a car that has rentals")
        self.repo.delete(car)