import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, Float, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.device.models.company_device import CompanyDevice


class DeviceCameraAssignment(BaseModel, SoftDeleteMixin):
    """Camera running detection on a company_device (model_assign)."""

    __tablename__ = "device_camera_assignments"

    model_assign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cameras.camera_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_devices.company_device_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    confidence_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="stopped")
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    company_device: Mapped["CompanyDevice"] = relationship(
        "CompanyDevice", back_populates="camera_assignments"
    )
