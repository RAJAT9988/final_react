from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.user_management.schemas.permission import PermissionDTO


class RoleBase(BaseModel):
    role_name: str


class RoleCreate(RoleBase):
    role_id: int


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None


class RoleDTO(RoleBase):
    role_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleWithPermissionsDTO(RoleDTO):
    permissions: List[PermissionDTO] = []
