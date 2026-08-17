import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.user_management.models.refresh_token import RefreshToken
    from app.user_management.models.role import Role


class User(BaseModel, SoftDeleteMixin):
    """Application user belonging to a company with a single global role."""

    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.role_id"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150), nullable=False, unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    password_reset_token_hash: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True
    )
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    role: Mapped["Role"] = relationship("Role", back_populates="users")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
