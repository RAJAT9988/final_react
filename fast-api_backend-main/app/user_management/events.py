import uuid
from dataclasses import dataclass


@dataclass
class UserCreated:
    __event_name__ = "user.created"
    user_id: uuid.UUID
    email: str
    company_id: uuid.UUID


@dataclass
class UserAddedToCompany:
    __event_name__ = "user.added_to_company"
    user_id: uuid.UUID
    company_id: uuid.UUID
    role_id: int


@dataclass
class UserRoleChanged:
    __event_name__ = "user.role_changed"
    user_id: uuid.UUID
    old_role_id: int
    new_role_id: int


@dataclass
class UserDeleted:
    __event_name__ = "user.deleted"
    user_id: uuid.UUID
    company_id: uuid.UUID


@dataclass
class UserRemoved:
    __event_name__ = "user.removed"
    user_id: uuid.UUID
    company_id: uuid.UUID


@dataclass
class UserDisabled:
    __event_name__ = "user.disabled"
    user_id: uuid.UUID


@dataclass
class TwoFactorEnabled:
    __event_name__ = "user.two_factor_enabled"
    user_id: uuid.UUID
