import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AddressBase(BaseModel):
    country_id: uuid.UUID
    state_id: uuid.UUID
    city: str
    area: Optional[str] = None
    locality: Optional[str] = None
    landmark: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AddressCreate(AddressBase):
    branch_id: Optional[uuid.UUID] = None


class AddressUpdate(BaseModel):
    country_id: Optional[uuid.UUID] = None
    state_id: Optional[uuid.UUID] = None
    city: Optional[str] = None
    area: Optional[str] = None
    locality: Optional[str] = None
    landmark: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    branch_id: Optional[uuid.UUID] = None


class AddressDTO(AddressBase):
    address_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
