from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.user_management.models.permission import Permission


class PermissionRepository(BaseRepository[Permission]):
    """Repository for Permission entity operations."""

    def __init__(self) -> None:
        super().__init__(Permission)

    async def get_by_id(
        self, db: AsyncSession, permission_id: int
    ) -> Optional[Permission]:
        stmt = select(Permission).where(Permission.permission_id == permission_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Permission]:
        stmt = select(Permission).where(Permission.name == name)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_all(self, db: AsyncSession) -> List[Permission]:
        stmt = select(Permission).order_by(Permission.permission_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())
