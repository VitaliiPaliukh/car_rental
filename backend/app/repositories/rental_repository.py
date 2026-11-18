from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import RentalStatus
from app.models.rental import Rental

BLOCKING = (RentalStatus.RESERVED, RentalStatus.ACTIVE, RentalStatus.OVERDUE)


class RentalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        status: RentalStatus | None = None,
        client_id: int | None = None,
        car_id: int | None = None,
    ) -> list[Rental]:
        stmt = select(Rental).order_by(Rental.id.desc())
        if status:
            stmt = stmt.where(Rental.status == status)
        if client_id:
            stmt = stmt.where(Rental.client_id == client_id)
        if car_id:
            stmt = stmt.where(Rental.car_id == car_id)
        return list(self.db.scalars(stmt))

    def get(self, rental_id: int) -> Rental | None:
        return self.db.get(Rental, rental_id)

    def has_overlap(self, car_id: int, start: date, end: date) -> bool:
        """Чи є в авто активна/заброньована оренда, що перетинається з [start, end)."""
        stmt = select(Rental.id).where(
            Rental.car_id == car_id,
            Rental.status.in_(BLOCKING),
            Rental.issue_date < end,
            Rental.expected_return_date > start,
        )
        return self.db.scalars(stmt).first() is not None

    def list_active(self) -> list[Rental]:
        return list(self.db.scalars(select(Rental).where(Rental.status == RentalStatus.ACTIVE)))

    def add(self, rental: Rental) -> Rental:
        self.db.add(rental)
        self.db.commit()
        self.db.refresh(rental)
        return rental

    def save(self, rental: Rental) -> Rental:
        self.db.commit()
        self.db.refresh(rental)
        return rental