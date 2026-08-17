import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.device.models.device import Device


class DeviceRepository(BaseRepository[Device]):
    """Repository for Device entity operations."""

    def __init__(self) -> None:
        super().__init__(Device)

    async def get_by_id(
        self, db: AsyncSession, device_id: uuid.UUID
    ) -> Optional[Device]:
        stmt = select(Device).where(
            Device.device_id == device_id,
            Device.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_serial_no(
        self, db: AsyncSession, serial_no: str
    ) -> Optional[Device]:
        stmt = select(Device).where(
            Device.serial_no == serial_no,
            Device.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_mac_id(self, db: AsyncSession, mac_id: str) -> Optional[Device]:
        stmt = select(Device).where(
            Device.mac_id == mac_id,
            Device.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_active_devices(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[Device]:
        stmt = (
            select(Device).where(Device.is_deleted.is_(False)).offset(skip).limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
