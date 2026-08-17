import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.device.models.device_camera_assignment import DeviceCameraAssignment


class DeviceCameraAssignmentRepository(BaseRepository[DeviceCameraAssignment]):
    """Repository for Device camera assignment operations."""

    def __init__(self) -> None:
        super().__init__(DeviceCameraAssignment)

    async def get_by_id(
        self, db: AsyncSession, model_assign_id: uuid.UUID
    ) -> Optional[DeviceCameraAssignment]:
        stmt = select(DeviceCameraAssignment).where(
            DeviceCameraAssignment.model_assign_id == model_assign_id,
            DeviceCameraAssignment.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_by_company_device_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> List[DeviceCameraAssignment]:
        stmt = select(DeviceCameraAssignment).where(
            DeviceCameraAssignment.company_device_id == company_device_id,
            DeviceCameraAssignment.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
