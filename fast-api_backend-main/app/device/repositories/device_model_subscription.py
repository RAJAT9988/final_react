import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.device.models.device_model_subscription import DeviceModelSubscription


class DeviceModelSubscriptionRepository(BaseRepository[DeviceModelSubscription]):
    """Repository for device_model_subscription operations."""

    def __init__(self) -> None:
        super().__init__(DeviceModelSubscription)

    async def get_by_id(
        self, db: AsyncSession, subscription_id: uuid.UUID
    ) -> Optional[DeviceModelSubscription]:
        stmt = select(DeviceModelSubscription).where(
            DeviceModelSubscription.subscription_id == subscription_id,
            DeviceModelSubscription.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_by_company_device_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> List[DeviceModelSubscription]:
        stmt = select(DeviceModelSubscription).where(
            DeviceModelSubscription.company_device_id == company_device_id,
            DeviceModelSubscription.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
