import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.device.models.company_device import CompanyDevice


class Device(BaseModel, SoftDeleteMixin):
    """Physical Atomo Processing Unit."""

    __tablename__ = "devices"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    device_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    ip: Mapped[str] = mapped_column(String(64), nullable=False)
    dns_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    device_role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="slave"
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Inactive")
    serial_no: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    mac_id: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    manufacturing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    company_devices: Mapped[List["CompanyDevice"]] = relationship(
        "CompanyDevice", back_populates="device"
    )
