from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    name: str
    module: str
    action: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    permission_id: int


class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    module: Optional[str] = None
    action: Optional[str] = None
    description: Optional[str] = None


class PermissionDTO(PermissionBase):
    permission_id: int
    is_allowed: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
