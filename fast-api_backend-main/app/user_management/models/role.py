from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel

if TYPE_CHECKING:
    from app.user_management.models.role_permission import RolePermission
    from app.user_management.models.user import User


class Role(BaseModel):
    """Global RBAC role (owner, admin, operator, viewer)."""

    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )

    users: Mapped[List["User"]] = relationship("User", back_populates="role")
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="role"
    )
