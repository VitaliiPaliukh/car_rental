import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import UserRole

_EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def _normalize_email(value: str) -> str:
    value = value.strip().lower()
    if not _EMAIL_RE.fullmatch(value):
        raise ValueError("Invalid email address")
    return value


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    address: str = Field(min_length=2)
    phone: str = Field(min_length=5)

    _check_email = field_validator("email")(_normalize_email)


class LoginRequest(BaseModel):
    email: str
    password: str

    _check_email = field_validator("email")(_normalize_email)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: UserRole
    client_id: int | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead