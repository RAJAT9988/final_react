import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.device.models.device_health import DeviceHealth


class DeviceHealthRepository(BaseRepository[DeviceHealth]):
    """Repository for device_health snapshots."""

    def __init__(self) -> None:
        super().__init__(DeviceHealth)

    async def get_by_id(
        self, db: AsyncSession, device_health_id: uuid.UUID
    ) -> Optional[DeviceHealth]:
        stmt = select(DeviceHealth).where(
            DeviceHealth.device_health_id == device_health_id,
            DeviceHealth.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_latest_by_company_device_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> Optional[DeviceHealth]:
        stmt = (
            select(DeviceHealth)
            .where(
                DeviceHealth.company_device_id == company_device_id,
                DeviceHealth.is_deleted.is_(False),
            )
            .order_by(DeviceHealth.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()
