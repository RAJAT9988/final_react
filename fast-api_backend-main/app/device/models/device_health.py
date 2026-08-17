import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.device.models.company_device import CompanyDevice


class DeviceHealth(BaseModel, SoftDeleteMixin):
    """Periodic CPU/NPU/RAM/temperature snapshot for a company_device."""

    __tablename__ = "device_health"

    device_health_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    company_device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_devices.company_device_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cpu_usage: Mapped[float] = mapped_column(Float, nullable=False)
    npu_usage: Mapped[float] = mapped_column(Float, nullable=False)
    ram: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)

    company_device: Mapped["CompanyDevice"] = relationship(
        "CompanyDevice", back_populates="health_snapshots"
    )
