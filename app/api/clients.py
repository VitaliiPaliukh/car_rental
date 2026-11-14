from fastapi import APIRouter, Depends

from app.api.deps import get_client_service
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.services.client_service import ClientService

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=list[ClientRead])
def list_clients(search: str | None = None, service: ClientService = Depends(get_client_service)):
    return service.list_clients(search)


@router.get("/{client_id}", response_model=ClientRead)
def get_client(client_id: int, service: ClientService = Depends(get_client_service)):
    return service.get_client(client_id)


@router.post("", response_model=ClientRead, status_code=201)
def create_client(data: ClientCreate, service: ClientService = Depends(get_client_service)):
    return service.create_client(data)


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int, data: ClientUpdate, service: ClientService = Depends(get_client_service)
):
    return service.update_client(client_id, data)


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, service: ClientService = Depends(get_client_service)):
    service.delete_client(client_id)