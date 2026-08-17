import uuid
from abc import ABC, abstractmethod
from typing import Annotated, List
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.dependencies.services import (
    PermissionServiceDep,
    RoleServiceDep,
    UserServiceDep,
)
from app.user_management.schemas.role import RoleDTO
from app.user_management.schemas.user import UserDTO


class UserManagementGatewayInterface(ABC):
    """Abstract sync interface for cross-module access to identity and RBAC."""

    @abstractmethod
    async def get_user(self, db: AsyncSession, user_id: uuid.UUID) -> UserDTO:
        pass

    @abstractmethod
    async def get_user_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[UserDTO]:
        pass

    @abstractmethod
    async def get_users_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[UserDTO]:
        pass

    @abstractmethod
    async def has_permission(
        self, db: AsyncSession, user_id: uuid.UUID, permission_name: str
    ) -> bool:
        pass

    @abstractmethod
    async def get_role(self, db: AsyncSession, role_id: int) -> RoleDTO:
        pass


class UserManagementGateway(UserManagementGatewayInterface):
    """Concrete Gateway delegating to user_management services."""

    def __init__(
        self,
        user_service: UserServiceDep,
        role_service: RoleServiceDep,
        permission_service: PermissionServiceDep,
    ) -> None:
        self.user_service = user_service
        self.role_service = role_service
        self.permission_service = permission_service

    async def get_user(self, db: AsyncSession, user_id: uuid.UUID) -> UserDTO:
        return await self.user_service.get_by_id(db, user_id)

    async def get_user_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[UserDTO]:
        return await self.user_service.list_users(db, skip=skip, limit=limit)

    async def get_users_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[UserDTO]:
        return await self.user_service.list_users_for_company(db, company_id)

    async def has_permission(
        self, db: AsyncSession, user_id: uuid.UUID, permission_name: str
    ) -> bool:
        return await self.permission_service.has_permission(
            db, user_id, permission_name
        )

    async def get_role(self, db: AsyncSession, role_id: int) -> RoleDTO:
        return await self.role_service.get_role(db, role_id)


def get_user_management_gateway(
    user_service: UserServiceDep,
    role_service: RoleServiceDep,
    permission_service: PermissionServiceDep,
) -> UserManagementGateway:
    return UserManagementGateway(
        user_service=user_service,
        role_service=role_service,
        permission_service=permission_service,
    )


UserManagementGatewayDep = Annotated[
    UserManagementGateway, Depends(get_user_management_gateway)
]
