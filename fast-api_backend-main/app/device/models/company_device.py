import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.device.models.device import Device
    from app.device.models.device_camera_assignment import DeviceCameraAssignment
    from app.device.models.device_health import DeviceHealth
    from app.device.models.device_model_subscription import DeviceModelSubscription


class CompanyDevice(BaseModel, SoftDeleteMixin):
    """Assignment of a Device to a company + branch, including enrollment state."""

    __tablename__ = "company_devices"

    company_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.device_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_branches.branch_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    assign_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    approval_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending_approval", index=True
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    device: Mapped["Device"] = relationship("Device", back_populates="company_devices")
    health_snapshots: Mapped[List["DeviceHealth"]] = relationship(
        "DeviceHealth", back_populates="company_device"
    )
    model_subscriptions: Mapped[List["DeviceModelSubscription"]] = relationship(
        "DeviceModelSubscription", back_populates="company_device"
    )
    camera_assignments: Mapped[List["DeviceCameraAssignment"]] = relationship(
        "DeviceCameraAssignment", back_populates="company_device"
    )
