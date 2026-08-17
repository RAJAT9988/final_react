import uuid
from typing import Annotated, Any, Callable, Coroutine

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.deps import DBSessionDep
from app.user_management.dependencies.repositories import UserRepositoryDep
from app.user_management.dependencies.services import (
    PermissionServiceDep,
    RoleServiceDep,
)
from app.user_management.exceptions import (
    UnauthorizedException,
    UserDisabledException,
    UserManagementException,
)
from app.user_management.schemas.user import UserDTO
from app.user_management.security import decode_access_token

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    db: DBSessionDep,
    user_repo: UserRepositoryDep,
    role_service: RoleServiceDep,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserDTO:
    """Resolve the caller from an access token (may be disabled)."""
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = uuid.UUID(str(payload["sub"]))
    except (UnauthorizedException, ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc

    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
    dto = UserDTO.model_validate(user)
    try:
        role = await role_service.get_role(db, user.role_id)
        dto.role_name = role.role_name
    except UserManagementException:
        dto.role_name = None
    return dto


async def get_active_user(
    current_user: Annotated[UserDTO, Depends(get_current_user)],
) -> UserDTO:
    """Same as CurrentUser, but rejects disabled accounts."""
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(UserDisabledException(current_user.user_id)),
        )
    return current_user


CurrentUser = Annotated[UserDTO, Depends(get_current_user)]
ActiveUser = Annotated[UserDTO, Depends(get_active_user)]


def RequirePermission(
    permission_name: str,
) -> Callable[..., Coroutine[Any, Any, UserDTO]]:
    """Route dependency factory: caller must be active and allowed `permission_name`."""

    async def _checker(
        current_user: ActiveUser,
        db: DBSessionDep,
        permission_service: PermissionServiceDep,
    ) -> UserDTO:
        allowed = await permission_service.has_permission(
            db, current_user.user_id, permission_name
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_name}.",
            )
        return current_user

    return _checker
