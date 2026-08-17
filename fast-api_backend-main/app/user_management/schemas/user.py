import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role_id: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserRoleUpdate(BaseModel):
    role_id: int


class UserDTO(UserBase):
    user_id: uuid.UUID
    role_id: int
    company_id: uuid.UUID
    status: str
    mfa_enabled: bool
    role_name: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPasswordResetDTO(UserDTO):
    reset_token: str
