import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.models.camera import Camera
from app.core.db.base_repository import BaseRepository


class CameraRepository(BaseRepository[Camera]):
    """Repository for Camera entity operations."""

    def __init__(self) -> None:
        super().__init__(Camera)

    async def get_by_id(
        self, db: AsyncSession, camera_id: uuid.UUID
    ) -> Optional[Camera]:
        stmt = select(Camera).where(
            Camera.camera_id == camera_id,
            Camera.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_active_cameras(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        company_device_id: Optional[uuid.UUID] = None,
        company_device_ids: Optional[List[uuid.UUID]] = None,
        zone: Optional[str] = None,
        department: Optional[str] = None,
        camera_group: Optional[str] = None,
        camera_status: Optional[str] = None,
    ) -> List[Camera]:
        stmt = select(Camera).where(Camera.is_deleted.is_(False))
        if company_device_id is not None:
            stmt = stmt.where(Camera.company_device_id == company_device_id)
        elif company_device_ids is not None:
            if not company_device_ids:
                return []
            stmt = stmt.where(Camera.company_device_id.in_(company_device_ids))
        if zone is not None:
            stmt = stmt.where(Camera.zone == zone)
        if department is not None:
            stmt = stmt.where(Camera.department == department)
        if camera_group is not None:
            stmt = stmt.where(Camera.camera_group == camera_group)
        if camera_status is not None:
            stmt = stmt.where(Camera.camera_status == camera_status)
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_company_device_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> List[Camera]:
        stmt = select(Camera).where(
            Camera.company_device_id == company_device_id,
            Camera.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
