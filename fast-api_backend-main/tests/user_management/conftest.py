import uuid
from typing import Any

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.gateway import CompanyGateway
from app.company.repositories.company import CompanyRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.services.company import CompanyService
from app.company.services.company_branch import CompanyBranchService
from app.user_management.repositories.permission import PermissionRepository
from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.repositories.role import RoleRepository
from app.user_management.repositories.role_permission import RolePermissionRepository
from app.user_management.repositories.user import UserRepository
from app.user_management.schemas.user import UserDTO
from app.user_management.security import hash_password
from app.user_management.seed import (
    ROLE_ADMIN,
    ROLE_OPERATOR,
    ROLE_OWNER,
    seed_roles_and_permissions,
)
from app.user_management.services.auth import AuthService
from app.user_management.services.permission import PermissionService
from app.user_management.services.role import RoleService
from app.user_management.services.user import UserService


def build_company_gateway() -> CompanyGateway:
    return CompanyGateway(
        company_service=CompanyService(CompanyRepository()),
        branch_service=CompanyBranchService(
            CompanyBranchRepository(), CompanyRepository()
        ),
    )


def build_user_service() -> UserService:
    return UserService(
        user_repo=UserRepository(),
        role_repo=RoleRepository(),
        refresh_token_repo=RefreshTokenRepository(),
        company_gateway=build_company_gateway(),
    )


def build_auth_service() -> AuthService:
    return AuthService(
        user_repo=UserRepository(),
        role_repo=RoleRepository(),
        refresh_token_repo=RefreshTokenRepository(),
        company_gateway=build_company_gateway(),
    )


def build_role_service() -> RoleService:
    return RoleService(
        role_repo=RoleRepository(),
        permission_repo=PermissionRepository(),
        role_permission_repo=RolePermissionRepository(),
    )


def build_permission_service() -> PermissionService:
    return PermissionService(
        user_repo=UserRepository(),
        role_permission_repo=RolePermissionRepository(),
    )


@pytest_asyncio.fixture
async def rbac(db_session: AsyncSession) -> None:
    await seed_roles_and_permissions(db_session)


@pytest_asyncio.fixture
async def company_id(db_session: AsyncSession) -> uuid.UUID:
    company = await CompanyRepository().create(db_session, {"company_name": "Test Co"})
    return company.company_id


async def create_user(
    db_session: AsyncSession,
    company_id: uuid.UUID,
    *,
    email: str,
    role_id: int = ROLE_OWNER,
    password: str = "Password123",
    name: str = "Test User",
) -> Any:
    return await UserRepository().create(
        db_session,
        {
            "name": name,
            "email": email.lower(),
            "password_hash": hash_password(password),
            "role_id": role_id,
            "company_id": company_id,
            "status": "active",
            "mfa_enabled": False,
        },
    )


async def user_dto_for(db_session: AsyncSession, user: Any) -> UserDTO:
    return await build_user_service()._to_dto(db_session, user)


__all__ = [
    "ROLE_ADMIN",
    "ROLE_OPERATOR",
    "ROLE_OWNER",
    "build_auth_service",
    "build_permission_service",
    "build_role_service",
    "build_user_service",
    "create_user",
    "user_dto_for",
]
