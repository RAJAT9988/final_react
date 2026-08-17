from typing import Annotated
from fastapi import Depends

from app.company import CompanyGatewayDep
from app.user_management.dependencies.repositories import (
    PermissionRepositoryDep,
    RefreshTokenRepositoryDep,
    RolePermissionRepositoryDep,
    RoleRepositoryDep,
    UserRepositoryDep,
)
from app.user_management.services.auth import AuthService
from app.user_management.services.permission import PermissionService
from app.user_management.services.role import RoleService
from app.user_management.services.user import UserService


def get_user_service(
    user_repo: UserRepositoryDep,
    role_repo: RoleRepositoryDep,
    refresh_token_repo: RefreshTokenRepositoryDep,
    company_gateway: CompanyGatewayDep,
) -> UserService:
    return UserService(
        user_repo=user_repo,
        role_repo=role_repo,
        refresh_token_repo=refresh_token_repo,
        company_gateway=company_gateway,
    )


def get_auth_service(
    user_repo: UserRepositoryDep,
    role_repo: RoleRepositoryDep,
    refresh_token_repo: RefreshTokenRepositoryDep,
    company_gateway: CompanyGatewayDep,
) -> AuthService:
    return AuthService(
        user_repo=user_repo,
        role_repo=role_repo,
        refresh_token_repo=refresh_token_repo,
        company_gateway=company_gateway,
    )


def get_role_service(
    role_repo: RoleRepositoryDep,
    permission_repo: PermissionRepositoryDep,
    role_permission_repo: RolePermissionRepositoryDep,
) -> RoleService:
    return RoleService(
        role_repo=role_repo,
        permission_repo=permission_repo,
        role_permission_repo=role_permission_repo,
    )


def get_permission_service(
    user_repo: UserRepositoryDep,
    role_permission_repo: RolePermissionRepositoryDep,
) -> PermissionService:
    return PermissionService(
        user_repo=user_repo,
        role_permission_repo=role_permission_repo,
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
RoleServiceDep = Annotated[RoleService, Depends(get_role_service)]
PermissionServiceDep = Annotated[PermissionService, Depends(get_permission_service)]
