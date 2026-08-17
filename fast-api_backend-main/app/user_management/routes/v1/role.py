from typing import List
from fastapi import APIRouter

from app.core.deps import DBSessionDep
from app.user_management.dependencies.auth import ActiveUser
from app.user_management.dependencies.services import RoleServiceDep
from app.user_management.http import handle_user_management_errors
from app.user_management.schemas.role import RoleDTO, RoleWithPermissionsDTO

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=List[RoleDTO])
@handle_user_management_errors
async def list_roles(
    _current_user: ActiveUser,
    db: DBSessionDep,
    service: RoleServiceDep,
) -> List[RoleDTO]:
    return await service.list_roles(db)


@router.get("/{id}/permissions", response_model=RoleWithPermissionsDTO)
@handle_user_management_errors
async def list_role_permissions(
    id: int,
    _current_user: ActiveUser,
    db: DBSessionDep,
    service: RoleServiceDep,
) -> RoleWithPermissionsDTO:
    return await service.get_role_permissions(db, id)
