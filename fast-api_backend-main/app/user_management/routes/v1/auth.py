from fastapi import APIRouter, status

from app.core.deps import DBSessionDep
from app.user_management.dependencies.auth import ActiveUser
from app.user_management.dependencies.services import AuthServiceDep
from app.user_management.http import handle_user_management_errors
from app.user_management.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    RestorePasswordRequest,
    RestorePasswordResponse,
    TwoFactorConfirmRequest,
    TwoFactorDisableRequest,
    TwoFactorEnableResponse,
    Verify2FARequest,
)
from app.user_management.schemas.user import UserDTO

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserDTO, status_code=status.HTTP_201_CREATED)
@handle_user_management_errors
async def register(
    body: RegisterRequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> UserDTO:
    return await service.register(db, body)


@router.post("/login", response_model=LoginResponse)
@handle_user_management_errors
async def login(
    body: LoginRequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> LoginResponse:
    return await service.login(db, str(body.email), body.password)


@router.post("/login/verify-2fa", response_model=LoginResponse)
@handle_user_management_errors
async def verify_2fa(
    body: Verify2FARequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> LoginResponse:
    return await service.verify_2fa(db, body.challenge_token, body.code)


@router.post("/refresh-token", response_model=LoginResponse)
@handle_user_management_errors
async def refresh_token(
    body: RefreshTokenRequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> LoginResponse:
    return await service.refresh(db, body.refresh_token)


@router.post("/restore-password", response_model=RestorePasswordResponse)
@handle_user_management_errors
async def restore_password(
    body: RestorePasswordRequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> RestorePasswordResponse:
    raw_token = await service.restore_password(db, str(body.email))
    return RestorePasswordResponse(reset_token=raw_token)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@handle_user_management_errors
async def reset_password(
    body: ResetPasswordRequest,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> None:
    await service.reset_password(db, body.token, body.new_password)


@router.post("/2fa/enable", response_model=TwoFactorEnableResponse)
@handle_user_management_errors
async def enable_2fa(
    current_user: ActiveUser,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> TwoFactorEnableResponse:
    secret, otpauth_uri = await service.enable_2fa(db, current_user)
    return TwoFactorEnableResponse(secret=secret, otpauth_uri=otpauth_uri)


@router.post("/2fa/confirm", response_model=UserDTO)
@handle_user_management_errors
async def confirm_2fa(
    body: TwoFactorConfirmRequest,
    current_user: ActiveUser,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> UserDTO:
    return await service.confirm_2fa(db, current_user, body.code)


@router.post("/2fa/disable", response_model=UserDTO)
@handle_user_management_errors
async def disable_2fa(
    body: TwoFactorDisableRequest,
    current_user: ActiveUser,
    db: DBSessionDep,
    service: AuthServiceDep,
) -> UserDTO:
    return await service.disable_2fa(db, current_user, body.code)
