from datetime import date

from app.patterns.reports import AvailabilityReport, FinancialReport
from app.repositories.car_repository import CarRepository


class ReportService:
    def __init__(self, cars: CarRepository):
        self.cars = cars

    def availability(self) -> dict:
        return AvailabilityReport(self.cars).generate()

    def financial(self, date_from: date | None = None, date_to: date | None = None) -> dict:
        return FinancialReport(self.cars).generate(date_from=date_from, date_to=date_to)