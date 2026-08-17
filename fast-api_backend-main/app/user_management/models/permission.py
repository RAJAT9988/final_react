from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel

if TYPE_CHECKING:
    from app.user_management.models.role_permission import RolePermission


class Permission(BaseModel):
    """Global permission catalog entry (module + action)."""

    __tablename__ = "permissions"

    permission_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission"
    )
