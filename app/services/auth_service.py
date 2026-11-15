from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.client import Client
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.client_repository import ClientRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, users: UserRepository, clients: ClientRepository):
        self.users = users
        self.clients = clients

    def register(self, data: RegisterRequest) -> User:
        """Реєстрація клієнта: створює обліковий запис і профіль клієнта."""
        if self.users.get_by_email(data.email):
            raise ConflictError("Email is already registered")
        client = self.clients.add(
            Client(full_name=data.full_name, address=data.address, phone=data.phone)
        )
        return self.users.add(
            User(
                email=data.email,
                password_hash=hash_password(data.password),
                role=UserRole.CLIENT,
                client_id=client.id,
            )
        )

    def create_admin(self, email: str, password: str) -> User:
        email = email.strip().lower()
        if self.users.get_by_email(email):
            raise ConflictError("Email is already registered")
        return self.users.add(
            User(email=email, password_hash=hash_password(password), role=UserRole.ADMIN)
        )

    def login(self, data: LoginRequest) -> tuple[User, str]:
        user = self.users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return user, create_access_token(user.id, user.role.value)

    def user_from_token(self, token: str) -> User:
        payload = decode_access_token(token)
        if payload is None:
            raise UnauthorizedError("Invalid or expired token")
        user = self.users.get(int(payload["sub"]))
        if user is None:
            raise UnauthorizedError("User no longer exists")
        return user