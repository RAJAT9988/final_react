import uuid
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.device.models.company_device import CompanyDevice
from app.device.models.device import Device


class CompanyDeviceRepository(BaseRepository[CompanyDevice]):
    """Repository for company_device assignment operations."""

    def __init__(self) -> None:
        super().__init__(CompanyDevice)

    async def get_by_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> Optional[CompanyDevice]:
        stmt = select(CompanyDevice).where(
            CompanyDevice.company_device_id == company_device_id,
            CompanyDevice.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_current_by_device_id(
        self, db: AsyncSession, device_id: uuid.UUID
    ) -> Optional[CompanyDevice]:
        stmt = (
            select(CompanyDevice)
            .where(
                CompanyDevice.device_id == device_id,
                CompanyDevice.is_deleted.is_(False),
            )
            .order_by(CompanyDevice.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_by_branch_id(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> List[CompanyDevice]:
        stmt = select(CompanyDevice).where(
            CompanyDevice.branch_id == branch_id,
            CompanyDevice.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_pending_by_branch_id(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> List[CompanyDevice]:
        stmt = select(CompanyDevice).where(
            CompanyDevice.branch_id == branch_id,
            CompanyDevice.approval_status == "pending_approval",
            CompanyDevice.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_company_id(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[CompanyDevice]:
        stmt = select(CompanyDevice).where(
            CompanyDevice.company_id == company_id,
            CompanyDevice.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_devices_by_branch(
        self, db: AsyncSession, branch_id: uuid.UUID, pending_only: bool = False
    ) -> List[Tuple[Device, CompanyDevice]]:
        stmt = (
            select(Device, CompanyDevice)
            .join(CompanyDevice, CompanyDevice.device_id == Device.device_id)
            .where(
                CompanyDevice.branch_id == branch_id,
                CompanyDevice.is_deleted.is_(False),
                Device.is_deleted.is_(False),
            )
        )
        if pending_only:
            stmt = stmt.where(CompanyDevice.approval_status == "pending_approval")
        result = await db.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]

    async def list_devices_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[Tuple[Device, CompanyDevice]]:
        stmt = (
            select(Device, CompanyDevice)
            .join(CompanyDevice, CompanyDevice.device_id == Device.device_id)
            .where(
                CompanyDevice.company_id == company_id,
                CompanyDevice.is_deleted.is_(False),
                Device.is_deleted.is_(False),
            )
        )
        result = await db.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]
