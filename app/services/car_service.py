from app.core.exceptions import NotFoundError
from app.models.car import Car
from app.models.enums import CarStatus
from app.repositories.car_repository import CarRepository
from app.schemas.car import CarCreate, CarUpdate


class CarService:
    def __init__(self, repo: CarRepository):
        self.repo = repo

    def list_cars(self, status: CarStatus | None = None) -> list[Car]:
        return self.repo.list(status)

    def get_car(self, car_id: int) -> Car:
        car = self.repo.get(car_id)
        if car is None:
            raise NotFoundError(f"Car {car_id} not found")
        return car

    def create_car(self, data: CarCreate) -> Car:
        # тут пізніше підключимо Factory Method за типом авто
        return self.repo.add(Car(**data.model_dump()))

    def update_car(self, car_id: int, data: CarUpdate) -> Car:
        car = self.get_car(car_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(car, field, value)
        return self.repo.save(car)

    def delete_car(self, car_id: int) -> None:
        self.repo.delete(self.get_car(car_id))