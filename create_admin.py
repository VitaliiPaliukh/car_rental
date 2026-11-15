import sys

from app import models  # noqa: F401
from app.core.database import SessionLocal
from app.repositories.client_repository import ClientRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService


def main():
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <email> <password>")
        raise SystemExit(1)
    db = SessionLocal()
    user = AuthService(UserRepository(db), ClientRepository(db)).create_admin(sys.argv[1], sys.argv[2])
    print(f"Admin created: {user.email} (id={user.id})")


if __name__ == "__main__":
    main()