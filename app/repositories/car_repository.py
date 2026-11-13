from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.enums import CarStatus


class CarRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, status: CarStatus | None = None) -> list[Car]:
        stmt = select(Car)
        if status:
            stmt = stmt.where(Car.status == status)
        return list(self.db.scalars(stmt))

    def get(self, car_id: int) -> Car | None:
        return self.db.get(Car, car_id)

    def add(self, car: Car) -> Car:
        self.db.add(car)
        self.db.commit()
        self.db.refresh(car)
        return car

    def save(self, car: Car) -> Car:
        self.db.commit()
        self.db.refresh(car)
        return car

    def delete(self, car: Car) -> None:
        self.db.delete(car)
        self.db.commit()