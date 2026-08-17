import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StateBase(BaseModel):
    state_name: str
    country_id: uuid.UUID


class StateCreate(StateBase):
    pass


class StateUpdate(BaseModel):
    state_name: Optional[str] = None
    country_id: Optional[uuid.UUID] = None


class StateDTO(StateBase):
    state_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
