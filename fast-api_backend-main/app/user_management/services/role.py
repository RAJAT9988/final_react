from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import RoleNotFoundException
from app.user_management.models.permission import Permission
from app.user_management.repositories.permission import PermissionRepository
from app.user_management.repositories.role import RoleRepository
from app.user_management.repositories.role_permission import RolePermissionRepository
from app.user_management.schemas.permission import PermissionDTO
from app.user_management.schemas.role import RoleDTO, RoleWithPermissionsDTO


class RoleService:
    """Read-only access to global roles and their permission matrix."""

    def __init__(
        self,
        role_repo: RoleRepository,
        permission_repo: PermissionRepository,
        role_permission_repo: RolePermissionRepository,
    ) -> None:
        self.role_repo = role_repo
        self.permission_repo = permission_repo
        self.role_permission_repo = role_permission_repo

    async def list_roles(self, db: AsyncSession) -> List[RoleDTO]:
        roles = await self.role_repo.list_all(db)
        return [RoleDTO.model_validate(role) for role in roles]

    async def get_role(self, db: AsyncSession, role_id: int) -> RoleDTO:
        role = await self.role_repo.get_by_id(db, role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        return RoleDTO.model_validate(role)

    async def get_role_permissions(
        self, db: AsyncSession, role_id: int
    ) -> RoleWithPermissionsDTO:
        role = await self.role_repo.get_by_id(db, role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        mappings = await self.role_permission_repo.list_by_role(db, role_id)
        permissions: List[PermissionDTO] = []
        for mapping in mappings:
            permission = await self.permission_repo.get_by_id(db, mapping.permission_id)
            if permission is None:
                continue
            dto = self._permission_dto(permission, mapping.is_allowed)
            permissions.append(dto)
        role_dto = RoleWithPermissionsDTO.model_validate(role)
        role_dto.permissions = permissions
        return role_dto

    def _permission_dto(
        self, permission: Permission, is_allowed: bool
    ) -> PermissionDTO:
        dto = PermissionDTO.model_validate(permission)
        dto.is_allowed = is_allowed
        return dto
