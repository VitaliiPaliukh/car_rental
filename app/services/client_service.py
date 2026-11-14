from app.core.exceptions import ConflictError, NotFoundError
from app.models.client import Client
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:
    def __init__(self, repo: ClientRepository):
        self.repo = repo

    def list_clients(self, search: str | None = None) -> list[Client]:
        return self.repo.get_all(search)

    def get_client(self, client_id: int) -> Client:
        client = self.repo.get(client_id)
        if client is None:
            raise NotFoundError(f"Client {client_id} not found")
        return client

    def create_client(self, data: ClientCreate) -> Client:
        return self.repo.add(Client(**data.model_dump()))

    def update_client(self, client_id: int, data: ClientUpdate) -> Client:
        client = self.get_client(client_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(client, field, value)
        return self.repo.save(client)

    def delete_client(self, client_id: int) -> None:
        client = self.get_client(client_id)
        if client.rentals:
            raise ConflictError("Cannot delete a client that has rentals")
        self.repo.delete(client)
