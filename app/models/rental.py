from datetime import date
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RentalStatus


class Rental(Base):
    __tablename__ = "rentals"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id"))
    issue_date: Mapped[date]
    expected_return_date: Mapped[date]
    actual_return_date: Mapped[date | None]
    deposit_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    status: Mapped[RentalStatus] = mapped_column(default=RentalStatus.RESERVED)

    client: Mapped["Client"] = relationship(back_populates="rentals")
    car: Mapped["Car"] = relationship(back_populates="rentals")
    fines: Mapped[list["Fine"]] = relationship(back_populates="rental")