import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CountryBase(BaseModel):
    country_name: str


class CountryCreate(CountryBase):
    pass


class CountryUpdate(BaseModel):
    country_name: Optional[str] = None


class CountryDTO(CountryBase):
    country_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
