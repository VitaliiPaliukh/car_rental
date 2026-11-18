from pydantic import BaseModel, ConfigDict, Field


class ClientCreate(BaseModel):
    full_name: str = Field(min_length=2)
    address: str = Field(min_length=2)
    phone: str = Field(min_length=5)


class ClientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2)
    address: str | None = Field(default=None, min_length=2)
    phone: str | None = Field(default=None, min_length=5)


class ClientRead(ClientCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
