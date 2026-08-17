from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class BaseModel(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_system_record: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )


class SoftDeleteMixin:
    """Opt-in mixin for entities supporting soft deletion."""

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
