from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CarStatus, CarType


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand: Mapped[str] = mapped_column(String(50))
    model: Mapped[str] = mapped_column(String(50))
    type: Mapped[CarType]
    year: Mapped[int]
    price_per_day: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    deposit: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[CarStatus] = mapped_column(default=CarStatus.AVAILABLE)

    rentals: Mapped[list["Rental"]] = relationship(back_populates="car")