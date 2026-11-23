from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.services.photo_storage import PhotoStorage
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.car_repository import CarRepository
from app.repositories.client_repository import ClientRepository
from app.repositories.rental_repository import RentalRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.car_service import CarService
from app.services.client_service import ClientService
from app.services.rental_service import RentalService
from app.services.report_service import ReportService

_bearer = HTTPBearer(auto_error=False)


def get_car_service(db: Session = Depends(get_db)) -> CarService:
    return CarService(CarRepository(db), RentalRepository(db), PhotoStorage())

def get_client_service(db: Session = Depends(get_db)) -> ClientService:
    return ClientService(ClientRepository(db))


def get_rental_service(db: Session = Depends(get_db)) -> RentalService:
    return RentalService(RentalRepository(db), CarRepository(db), ClientRepository(db))


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(CarRepository(db))


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db), ClientRepository(db))


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    auth: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")
    return auth.user_from_token(credentials.credentials)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")
    return user