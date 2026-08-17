import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db.base_model import BaseModel, SoftDeleteMixin


class Camera(BaseModel, SoftDeleteMixin):
    """Video source attached to a company_device assignment."""

    __tablename__ = "cameras"

    camera_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    camera_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    company_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_devices.company_device_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    camera_type: Mapped[str] = mapped_column(String(20), nullable=False)
    rtsp_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    camera_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="offline"
    )
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    zone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    camera_group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fps_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
