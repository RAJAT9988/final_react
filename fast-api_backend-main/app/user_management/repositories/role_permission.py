from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_repository import BaseRepository
from app.user_management.models.permission import Permission
from app.user_management.models.role_permission import RolePermission


class RolePermissionRepository(BaseRepository[RolePermission]):
    """Repository for RolePermission junction operations."""

    def __init__(self) -> None:
        super().__init__(RolePermission)

    async def list_by_role(
        self, db: AsyncSession, role_id: int
    ) -> List[RolePermission]:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.is_deleted.is_(False),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def is_allowed(
        self, db: AsyncSession, role_id: int, permission_name: str
    ) -> bool:
        stmt = (
            select(RolePermission)
            .join(
                Permission,
                Permission.permission_id == RolePermission.permission_id,
            )
            .where(
                RolePermission.role_id == role_id,
                Permission.name == permission_name,
                RolePermission.is_allowed.is_(True),
                RolePermission.is_deleted.is_(False),
            )
        )
        result = await db.execute(stmt)
        return result.scalars().first() is not None
