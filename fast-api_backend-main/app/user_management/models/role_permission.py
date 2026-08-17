from typing import TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.user_management.models.permission import Permission
    from app.user_management.models.role import Role


class RolePermission(BaseModel, SoftDeleteMixin):
    """Junction: whether a global role is allowed a catalog permission."""

    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("roles.role_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("permissions.permission_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_allowed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    role: Mapped["Role"] = relationship("Role", back_populates="role_permissions")
    permission: Mapped["Permission"] = relationship(
        "Permission", back_populates="role_permissions"
    )
