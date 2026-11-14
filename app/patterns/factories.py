from abc import ABC, abstractmethod
from decimal import Decimal

from app.models.car import Car
from app.models.enums import CarStatus, CarType
from app.patterns.pricing import money
from app.schemas.car import CarCreate


class CarFactory(ABC):
    car_type: CarType

    @abstractmethod
    def default_deposit(self, price_per_day: Decimal) -> Decimal:
        """Factory method: підклас визначає політику застави."""

    def create(self, data: CarCreate) -> Car:
        deposit = data.deposit if data.deposit is not None else self.default_deposit(data.price_per_day)
        return Car(
            brand=data.brand,
            model=data.model,
            type=self.car_type,
            year=data.year,
            price_per_day=data.price_per_day,
            deposit=money(deposit),
            status=CarStatus.AVAILABLE,
        )


class EconomyCarFactory(CarFactory):
    car_type = CarType.ECONOMY

    def default_deposit(self, price_per_day: Decimal) -> Decimal:
        return price_per_day * 4


class SuvCarFactory(CarFactory):
    car_type = CarType.SUV

    def default_deposit(self, price_per_day: Decimal) -> Decimal:
        return price_per_day * 6


class PremiumCarFactory(CarFactory):
    car_type = CarType.PREMIUM

    def default_deposit(self, price_per_day: Decimal) -> Decimal:
        return price_per_day * 10


_FACTORIES: dict[CarType, CarFactory] = {
    CarType.ECONOMY: EconomyCarFactory(),
    CarType.SUV: SuvCarFactory(),
    CarType.PREMIUM: PremiumCarFactory(),
}


def get_factory(car_type: CarType) -> CarFactory:
    return _FACTORIES[car_type]
