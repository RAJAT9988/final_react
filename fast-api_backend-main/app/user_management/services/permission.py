import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import UserNotFoundException
from app.user_management.repositories.role_permission import RolePermissionRepository
from app.user_management.repositories.user import UserRepository


class PermissionService:
    """Permission checks for a user's assigned role."""

    def __init__(
        self,
        user_repo: UserRepository,
        role_permission_repo: RolePermissionRepository,
    ) -> None:
        self.user_repo = user_repo
        self.role_permission_repo = role_permission_repo

    async def has_permission(
        self, db: AsyncSession, user_id: uuid.UUID, permission_name: str
    ) -> bool:
        user = await self.user_repo.get_by_id(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return await self.role_permission_repo.is_allowed(
            db, user.role_id, permission_name
        )
