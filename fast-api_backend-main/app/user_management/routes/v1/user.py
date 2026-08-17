import uuid
from typing import Annotated, List
from fastapi import APIRouter, Depends, status

from app.core.deps import DBSessionDep
from app.user_management.dependencies.auth import ActiveUser, RequirePermission
from app.user_management.dependencies.services import UserServiceDep
from app.user_management.http import handle_user_management_errors
from app.user_management.schemas.user import (
    UserCreate,
    UserDTO,
    UserPasswordResetDTO,
    UserRoleUpdate,
    UserUpdate,
)

router = APIRouter(tags=["Users"])


@router.get(
    "/companies/{company_id}/users",
    response_model=List[UserDTO],
)
@handle_user_management_errors
async def list_company_users(
    company_id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("edit_user"))],
    skip: int = 0,
    limit: int = 100,
) -> List[UserDTO]:
    return await service.list_users_by_company(
        db, actor, company_id, skip=skip, limit=limit
    )


@router.post(
    "/companies/{company_id}/users",
    response_model=UserDTO,
    status_code=status.HTTP_201_CREATED,
)
@handle_user_management_errors
async def add_company_user(
    company_id: uuid.UUID,
    body: UserCreate,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("add_user"))],
) -> UserDTO:
    return await service.add_user(db, actor, company_id, body)


@router.get("/users/{id}", response_model=UserDTO)
@handle_user_management_errors
async def get_user(
    id: uuid.UUID,
    current_user: ActiveUser,
    db: DBSessionDep,
    service: UserServiceDep,
) -> UserDTO:
    return await service.get_visible_user(db, current_user, id)


@router.patch("/users/{id}", response_model=UserDTO)
@handle_user_management_errors
async def update_user(
    id: uuid.UUID,
    body: UserUpdate,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("edit_user"))],
) -> UserDTO:
    return await service.update_user(db, actor, id, body)


@router.delete("/users/{id}", response_model=UserDTO)
@handle_user_management_errors
async def delete_user(
    id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("remove_user"))],
) -> UserDTO:
    return await service.delete_user(db, actor, id)


@router.patch("/users/{id}/role", response_model=UserDTO)
@handle_user_management_errors
async def assign_role(
    id: uuid.UUID,
    body: UserRoleUpdate,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("assign_role"))],
) -> UserDTO:
    return await service.assign_role(db, actor, id, body.role_id)


@router.post("/users/{id}/enable", response_model=UserDTO)
@handle_user_management_errors
async def enable_user(
    id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("enable_disable_user"))],
) -> UserDTO:
    return await service.set_enabled(db, actor, id, enabled=True)


@router.post("/users/{id}/disable", response_model=UserDTO)
@handle_user_management_errors
async def disable_user(
    id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("enable_disable_user"))],
) -> UserDTO:
    return await service.set_enabled(db, actor, id, enabled=False)


@router.post("/users/{id}/reset-password", response_model=UserPasswordResetDTO)
@handle_user_management_errors
async def reset_user_password(
    id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("reset_user_password"))],
) -> UserPasswordResetDTO:
    dto, raw_token = await service.trigger_password_reset(db, actor, id)
    return UserPasswordResetDTO(**dto.model_dump(), reset_token=raw_token)


@router.post("/users/{id}/force-logout", response_model=UserDTO)
@handle_user_management_errors
async def force_logout_user(
    id: uuid.UUID,
    db: DBSessionDep,
    service: UserServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("force_logout_user"))],
) -> UserDTO:
    return await service.force_logout(db, actor, id)
