import enum


class CarType(str, enum.Enum):
    ECONOMY = "economy"
    SUV = "suv"
    PREMIUM = "premium"


class CarStatus(str, enum.Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"


class RentalStatus(str, enum.Enum):
    RESERVED = "reserved"
    ACTIVE = "active"
    OVERDUE = "overdue"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class DamageLevel(str, enum.Enum):
    NONE = "none"
    MINOR = "minor"
    MAJOR = "major"