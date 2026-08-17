import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.device.models.company_device import CompanyDevice


class DeviceModelSubscription(BaseModel, SoftDeleteMixin):
    """AI model subscription enabled on a company_device assignment."""

    __tablename__ = "device_model_subscriptions"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    company_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_devices.company_device_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    subscription_key: Mapped[str] = mapped_column(String(255), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enabled_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    company_device: Mapped["CompanyDevice"] = relationship(
        "CompanyDevice", back_populates="model_subscriptions"
    )
