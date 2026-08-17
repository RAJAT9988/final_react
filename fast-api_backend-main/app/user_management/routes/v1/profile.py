from fastapi import APIRouter

from app.core.deps import DBSessionDep
from app.user_management.dependencies.auth import ActiveUser
from app.user_management.dependencies.services import UserServiceDep
from app.user_management.http import handle_user_management_errors
from app.user_management.schemas.auth import ProfileUpdate
from app.user_management.schemas.user import UserDTO, UserUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserDTO)
@handle_user_management_errors
async def get_profile(current_user: ActiveUser) -> UserDTO:
    return current_user


@router.patch("", response_model=UserDTO)
@handle_user_management_errors
async def update_profile(
    body: ProfileUpdate,
    current_user: ActiveUser,
    db: DBSessionDep,
    service: UserServiceDep,
) -> UserDTO:
    return await service.update_profile(
        db, current_user, UserUpdate(name=body.name, email=body.email)
    )
