from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.client import Client


class ClientRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, search: str | None = None) -> list[Client]:
        stmt = select(Client).order_by(Client.id)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Client.full_name.ilike(like), Client.phone.ilike(like)))
        return list(self.db.scalars(stmt))

    def get(self, client_id: int) -> Client | None:
        return self.db.get(Client, client_id)

    def add(self, client: Client) -> Client:
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client

    def save(self, client: Client) -> Client:
        self.db.commit()
        self.db.refresh(client)
        return client

    def delete(self, client: Client) -> None:
        self.db.delete(client)
        self.db.commit()