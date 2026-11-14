from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.enums import CarStatus, CarType


class CarRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, status: CarStatus | None = None, car_type: CarType | None = None) -> list[Car]:
        stmt = select(Car).order_by(Car.id)
        if status:
            stmt = stmt.where(Car.status == status)
        if car_type:
            stmt = stmt.where(Car.type == car_type)
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