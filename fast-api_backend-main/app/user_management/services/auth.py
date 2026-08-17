import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.company import CompanyGateway
from app.user_management.emails.templates import (
    notify_password_reset,
    notify_two_factor_enabled,
    notify_user_registration,
)
from app.user_management.events import TwoFactorEnabled, UserCreated
from app.user_management.exceptions import (
    CompanyHasUsersException,
    CompanyNotAvailableException,
    InvalidCredentialsException,
    OwnerRoleRequiredException,
    PasswordResetInvalidException,
    RefreshTokenInvalidException,
    RefreshTokenReuseDetectedException,
    RoleNotFoundException,
    TwoFactorAlreadyEnabledException,
    TwoFactorNotEnabledException,
    UserAlreadyExistsException,
    UserDisabledException,
    UserNotFoundException,
)
from app.user_management.models.user import User
from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.repositories.role import RoleRepository
from app.user_management.repositories.user import UserRepository
from app.user_management.schemas.auth import LoginResponse, RegisterRequest
from app.user_management.schemas.user import UserDTO
from app.user_management.security import (
    as_utc,
    build_otpauth_uri,
    create_2fa_challenge_token,
    create_access_token,
    decode_2fa_challenge_token,
    generate_totp_secret,
    generate_urlsafe_token,
    hash_password,
    hash_token,
    password_reset_expiry,
    refresh_token_expiry,
    verify_password,
    verify_totp,
)
from app.user_management.seed import ROLE_OWNER


class AuthService:
    """Registration, login, token rotation, password reset, and Owner TOTP."""

    def __init__(
        self,
        user_repo: UserRepository,
        role_repo: RoleRepository,
        refresh_token_repo: RefreshTokenRepository,
        company_gateway: CompanyGateway,
    ) -> None:
        self.user_repo = user_repo
        self.role_repo = role_repo
        self.refresh_token_repo = refresh_token_repo
        self.company_gateway = company_gateway

    async def register(self, db: AsyncSession, obj_in: RegisterRequest) -> UserDTO:
        try:
            await self.company_gateway.get_company(db, obj_in.company_id)
        except Exception as exc:
            raise CompanyNotAvailableException(obj_in.company_id) from exc

        existing_count = await self.user_repo.count_by_company(db, obj_in.company_id)
        if existing_count > 0:
            raise CompanyHasUsersException(obj_in.company_id)

        email = str(obj_in.email).lower()
        if await self.user_repo.get_by_email(db, email):
            raise UserAlreadyExistsException(email)

        owner_role = await self.role_repo.get_by_id(db, ROLE_OWNER)
        if not owner_role:
            raise RoleNotFoundException(ROLE_OWNER)

        user = await self.user_repo.create(
            db,
            {
                "name": obj_in.name,
                "email": email,
                "password_hash": hash_password(obj_in.password),
                "role_id": ROLE_OWNER,
                "company_id": obj_in.company_id,
                "status": "active",
                "mfa_enabled": False,
            },
        )
        dto = await self._to_dto(db, user)
        notify_user_registration()
        _event = UserCreated(
            user_id=dto.user_id, email=dto.email, company_id=dto.company_id
        )
        return dto

    async def login(self, db: AsyncSession, email: str, password: str) -> LoginResponse:
        user = await self.user_repo.get_by_email(db, email.lower())
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsException()
        if user.status != "active":
            raise UserDisabledException(user.user_id)

        role = await self.role_repo.get_by_id(db, user.role_id)
        role_name = role.role_name if role else ""

        if role_name == "owner" and user.mfa_enabled:
            return LoginResponse(
                mfa_required=True,
                challenge_token=create_2fa_challenge_token(user.user_id),
            )

        return await self._issue_tokens(db, user, role_name)

    async def verify_2fa(
        self, db: AsyncSession, challenge_token: str, code: str
    ) -> LoginResponse:
        payload = decode_2fa_challenge_token(challenge_token)
        user_id = uuid.UUID(str(payload["sub"]))
        user = await self.user_repo.get_by_id(db, user_id)
        if not user:
            raise InvalidCredentialsException()
        if user.status != "active":
            raise UserDisabledException(user.user_id)
        if not user.mfa_enabled:
            raise TwoFactorNotEnabledException()
        verify_totp(user.mfa_secret, code)
        role = await self.role_repo.get_by_id(db, user.role_id)
        role_name = role.role_name if role else ""
        return await self._issue_tokens(db, user, role_name)

    async def refresh(self, db: AsyncSession, raw_refresh_token: str) -> LoginResponse:
        token_row = await self.refresh_token_repo.get_by_token_hash(
            db, hash_token(raw_refresh_token)
        )
        if token_row is None:
            raise RefreshTokenInvalidException()

        now = datetime.now(timezone.utc)
        if token_row.revoked:
            await self.refresh_token_repo.revoke_family(db, token_row.family_id)
            raise RefreshTokenReuseDetectedException()
        if as_utc(token_row.expires_at) <= now:
            raise RefreshTokenInvalidException()

        user = await self.user_repo.get_by_id(db, token_row.user_id)
        if not user or user.status != "active":
            await self.refresh_token_repo.revoke_family(db, token_row.family_id)
            raise RefreshTokenInvalidException()

        await self.refresh_token_repo.update(db, token_row, {"revoked": True})
        role = await self.role_repo.get_by_id(db, user.role_id)
        role_name = role.role_name if role else ""
        return await self._issue_tokens(
            db, user, role_name, family_id=token_row.family_id
        )

    async def restore_password(self, db: AsyncSession, email: str) -> Optional[str]:
        """Store a hashed reset token and return the raw token.

        Mail is not wired yet, so the caller must receive the raw value to
        complete ``reset_password``. Unknown emails return None (same 200).
        """
        user = await self.user_repo.get_by_email(db, email.lower())
        if not user:
            return None
        raw_token = generate_urlsafe_token()
        await self.user_repo.update(
            db,
            user,
            {
                "password_reset_token_hash": hash_token(raw_token),
                "password_reset_expires_at": password_reset_expiry(),
            },
        )
        notify_password_reset()
        return raw_token

    async def reset_password(
        self, db: AsyncSession, raw_token: str, new_password: str
    ) -> None:
        token_hash = hash_token(raw_token.strip())
        matched = await self.user_repo.get_by_reset_token_hash(db, token_hash)
        if matched is None:
            raise PasswordResetInvalidException()
        expires = matched.password_reset_expires_at
        if expires is None:
            raise PasswordResetInvalidException()
        if as_utc(expires) <= datetime.now(timezone.utc):
            raise PasswordResetInvalidException()

        await self.user_repo.update_including_none(
            db,
            matched,
            {
                "password_hash": hash_password(new_password),
                "password_reset_token_hash": None,
                "password_reset_expires_at": None,
            },
        )
        await self.refresh_token_repo.revoke_all_for_user(db, matched.user_id)

    async def enable_2fa(self, db: AsyncSession, actor: UserDTO) -> tuple[str, str]:
        user = await self._require_owner(db, actor)
        if user.mfa_enabled:
            raise TwoFactorAlreadyEnabledException()
        secret = generate_totp_secret()
        await self.user_repo.update(
            db, user, {"mfa_secret": secret, "mfa_enabled": False}
        )
        return secret, build_otpauth_uri(secret, user.email)

    async def confirm_2fa(self, db: AsyncSession, actor: UserDTO, code: str) -> UserDTO:
        user = await self._require_owner(db, actor)
        if user.mfa_enabled:
            raise TwoFactorAlreadyEnabledException()
        if not user.mfa_secret:
            raise TwoFactorNotEnabledException()
        verify_totp(user.mfa_secret, code)
        updated = await self.user_repo.update(db, user, {"mfa_enabled": True})
        notify_two_factor_enabled()
        _event = TwoFactorEnabled(user_id=updated.user_id)
        return await self._to_dto(db, updated)

    async def disable_2fa(self, db: AsyncSession, actor: UserDTO, code: str) -> UserDTO:
        user = await self._require_owner(db, actor)
        if not user.mfa_enabled:
            raise TwoFactorNotEnabledException()
        verify_totp(user.mfa_secret, code)
        updated = await self.user_repo.update_including_none(
            db, user, {"mfa_enabled": False, "mfa_secret": None}
        )
        return await self._to_dto(db, updated)

    async def _require_owner(self, db: AsyncSession, actor: UserDTO) -> User:
        if actor.role_name != "owner":
            raise OwnerRoleRequiredException()
        user = await self.user_repo.get_by_id(db, actor.user_id)
        if not user:
            raise UserNotFoundException(actor.user_id)
        return user

    async def _issue_tokens(
        self,
        db: AsyncSession,
        user: User,
        role_name: str,
        family_id: Optional[uuid.UUID] = None,
    ) -> LoginResponse:
        raw_refresh = generate_urlsafe_token()
        await self.refresh_token_repo.create(
            db,
            {
                "user_id": user.user_id,
                "family_id": family_id or uuid.uuid4(),
                "token_hash": hash_token(raw_refresh),
                "expires_at": refresh_token_expiry(),
                "revoked": False,
            },
        )
        return LoginResponse(
            access_token=create_access_token(user.user_id, user.company_id, role_name),
            refresh_token=raw_refresh,
            mfa_required=False,
        )

    async def _to_dto(self, db: AsyncSession, user: User) -> UserDTO:
        dto = UserDTO.model_validate(user)
        role = await self.role_repo.get_by_id(db, user.role_id)
        dto.role_name = role.role_name if role else None
        return dto
