from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.user_management.models.role import Role


class RoleRepository(BaseRepository[Role]):
    """Repository for Role entity operations."""

    def __init__(self) -> None:
        super().__init__(Role)

    async def get_by_id(self, db: AsyncSession, role_id: int) -> Optional[Role]:
        stmt = select(Role).where(Role.role_id == role_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, role_name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.role_name == role_name)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def list_all(self, db: AsyncSession) -> List[Role]:
        stmt = select(Role).order_by(Role.role_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())
