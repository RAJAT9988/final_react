from typing import Annotated
from fastapi import Depends

from app.user_management.repositories.permission import PermissionRepository
from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.repositories.role import RoleRepository
from app.user_management.repositories.role_permission import RolePermissionRepository
from app.user_management.repositories.user import UserRepository


def get_user_repository() -> UserRepository:
    return UserRepository()


def get_role_repository() -> RoleRepository:
    return RoleRepository()


def get_permission_repository() -> PermissionRepository:
    return PermissionRepository()


def get_role_permission_repository() -> RolePermissionRepository:
    return RolePermissionRepository()


def get_refresh_token_repository() -> RefreshTokenRepository:
    return RefreshTokenRepository()


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]
RoleRepositoryDep = Annotated[RoleRepository, Depends(get_role_repository)]
PermissionRepositoryDep = Annotated[
    PermissionRepository, Depends(get_permission_repository)
]
RolePermissionRepositoryDep = Annotated[
    RolePermissionRepository, Depends(get_role_permission_repository)
]
RefreshTokenRepositoryDep = Annotated[
    RefreshTokenRepository, Depends(get_refresh_token_repository)
]
