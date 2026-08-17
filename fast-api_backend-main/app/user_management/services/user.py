import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.company import CompanyGateway
from app.user_management.emails.templates import notify_password_reset
from app.user_management.events import (
    UserAddedToCompany,
    UserDeleted,
    UserDisabled,
    UserRemoved,
    UserRoleChanged,
)
from app.user_management.exceptions import (
    CompanyNotAvailableException,
    InvalidRoleAssignmentException,
    PermissionDeniedException,
    RoleNotFoundException,
    UserAlreadyExistsException,
    UserNotFoundException,
)
from app.user_management.models.user import User
from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.repositories.role import RoleRepository
from app.user_management.repositories.user import UserRepository
from app.user_management.schemas.user import UserCreate, UserDTO, UserUpdate
from app.user_management.security import (
    generate_urlsafe_token,
    hash_password,
    hash_token,
    password_reset_expiry,
)
from app.user_management.seed import ROLE_ADMIN, ROLE_OPERATOR, ROLE_OWNER, ROLE_VIEWER


class UserService:
    """Company-scoped user lifecycle and role assignment."""

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

    async def _to_dto(self, db: AsyncSession, user: User) -> UserDTO:
        dto = UserDTO.model_validate(user)
        role = await self.role_repo.get_by_id(db, user.role_id)
        dto.role_name = role.role_name if role else None
        return dto

    async def _require_company(self, db: AsyncSession, company_id: uuid.UUID) -> None:
        try:
            await self.company_gateway.get_company(db, company_id)
        except Exception as exc:
            raise CompanyNotAvailableException(company_id) from exc

    async def get_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> UserDTO:
        user = await self.user_repo.get_by_id(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return await self._to_dto(db, user)

    async def get_visible_user(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID
    ) -> UserDTO:
        """Owner/Admin may read coworkers; anyone may read themselves."""
        target = await self.get_by_id(db, user_id)
        if actor.user_id == user_id:
            return target
        if actor.role_name not in {"owner", "admin"}:
            raise PermissionDeniedException("edit_user")
        if actor.company_id != target.company_id:
            raise UserNotFoundException(user_id)
        return target

    async def list_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[UserDTO]:
        users = await self.user_repo.list_all(db, skip=skip, limit=limit)
        return [await self._to_dto(db, user) for user in users]

    async def list_users_for_company(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[UserDTO]:
        users = await self.user_repo.list_by_company(
            db, company_id, skip=skip, limit=limit
        )
        return [await self._to_dto(db, user) for user in users]

    async def list_users_by_company(
        self,
        db: AsyncSession,
        actor: UserDTO,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[UserDTO]:
        if actor.company_id != company_id:
            raise PermissionDeniedException()
        await self._require_company(db, company_id)
        users = await self.user_repo.list_by_company(
            db, company_id, skip=skip, limit=limit
        )
        return [await self._to_dto(db, user) for user in users]

    async def add_user(
        self,
        db: AsyncSession,
        actor: UserDTO,
        company_id: uuid.UUID,
        obj_in: UserCreate,
    ) -> UserDTO:
        if actor.company_id != company_id:
            raise PermissionDeniedException("add_user")
        await self._require_company(db, company_id)
        await self._assert_role_assignment(actor, obj_in.role_id)
        existing = await self.user_repo.get_by_email(db, str(obj_in.email))
        if existing:
            raise UserAlreadyExistsException(str(obj_in.email))
        role = await self.role_repo.get_by_id(db, obj_in.role_id)
        if not role:
            raise RoleNotFoundException(obj_in.role_id)
        user = await self.user_repo.create(
            db,
            {
                "name": obj_in.name,
                "email": str(obj_in.email).lower(),
                "password_hash": hash_password(obj_in.password),
                "role_id": obj_in.role_id,
                "company_id": company_id,
                "status": "active",
                "mfa_enabled": False,
            },
        )
        dto = await self._to_dto(db, user)
        _event = UserAddedToCompany(
            user_id=dto.user_id, company_id=company_id, role_id=dto.role_id
        )
        return dto

    async def update_user(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID, obj_in: UserUpdate
    ) -> UserDTO:
        user = await self._coworker_or_404(db, actor, user_id)
        payload = obj_in.model_dump(exclude_unset=True)
        if "email" in payload and payload["email"] is not None:
            payload["email"] = str(payload["email"]).lower()
            existing = await self.user_repo.get_by_email(db, payload["email"])
            if existing and existing.user_id != user_id:
                raise UserAlreadyExistsException(payload["email"])
        updated = await self.user_repo.update(db, user, payload)
        return await self._to_dto(db, updated)

    async def delete_user(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID
    ) -> UserDTO:
        if actor.user_id == user_id:
            raise PermissionDeniedException("remove_user")
        user = await self._coworker_or_404(db, actor, user_id)
        deleted = await self.user_repo.soft_delete(db, user)
        await self.refresh_token_repo.revoke_all_for_user(db, user_id)
        dto = await self._to_dto(db, deleted)
        _event = UserDeleted(user_id=dto.user_id, company_id=dto.company_id)
        _removed = UserRemoved(user_id=dto.user_id, company_id=dto.company_id)
        return dto

    async def assign_role(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID, role_id: int
    ) -> UserDTO:
        if actor.user_id == user_id:
            raise PermissionDeniedException("assign_role")
        await self._assert_role_assignment(actor, role_id)
        user = await self._coworker_or_404(db, actor, user_id)
        role = await self.role_repo.get_by_id(db, role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        old_role_id = user.role_id
        updated = await self.user_repo.update(db, user, {"role_id": role_id})
        dto = await self._to_dto(db, updated)
        _event = UserRoleChanged(
            user_id=dto.user_id, old_role_id=old_role_id, new_role_id=role_id
        )
        return dto

    async def set_enabled(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID, enabled: bool
    ) -> UserDTO:
        if actor.user_id == user_id:
            raise PermissionDeniedException("enable_disable_user")
        user = await self._coworker_or_404(db, actor, user_id)
        status = "active" if enabled else "disabled"
        updated = await self.user_repo.update(db, user, {"status": status})
        if not enabled:
            await self.refresh_token_repo.revoke_all_for_user(db, user_id)
            _event = UserDisabled(user_id=user_id)
        return await self._to_dto(db, updated)

    async def trigger_password_reset(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID
    ) -> tuple[UserDTO, str]:
        user = await self._coworker_or_404(db, actor, user_id)
        raw_token = generate_urlsafe_token()
        updated = await self.user_repo.update(
            db,
            user,
            {
                "password_reset_token_hash": hash_token(raw_token),
                "password_reset_expires_at": password_reset_expiry(),
            },
        )
        notify_password_reset()
        return await self._to_dto(db, updated), raw_token

    async def force_logout(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID
    ) -> UserDTO:
        user = await self._coworker_or_404(db, actor, user_id)
        await self.refresh_token_repo.revoke_all_for_user(db, user.user_id)
        return await self._to_dto(db, user)

    async def update_profile(
        self, db: AsyncSession, actor: UserDTO, obj_in: UserUpdate
    ) -> UserDTO:
        user = await self.user_repo.get_by_id(db, actor.user_id)
        if not user:
            raise UserNotFoundException(actor.user_id)
        payload = obj_in.model_dump(exclude_unset=True)
        if "email" in payload and payload["email"] is not None:
            payload["email"] = str(payload["email"]).lower()
            existing = await self.user_repo.get_by_email(db, payload["email"])
            if existing and existing.user_id != actor.user_id:
                raise UserAlreadyExistsException(payload["email"])
        updated = await self.user_repo.update(db, user, payload)
        return await self._to_dto(db, updated)

    async def _coworker_or_404(
        self, db: AsyncSession, actor: UserDTO, user_id: uuid.UUID
    ) -> User:
        user = await self.user_repo.get_by_id(db, user_id)
        if not user or user.company_id != actor.company_id:
            raise UserNotFoundException(user_id)
        return user

    async def _assert_role_assignment(self, actor: UserDTO, role_id: int) -> None:
        if actor.role_name == "admin" and role_id in {ROLE_OWNER, ROLE_ADMIN}:
            raise InvalidRoleAssignmentException()
        if role_id not in {ROLE_OWNER, ROLE_ADMIN, ROLE_OPERATOR, ROLE_VIEWER}:
            raise RoleNotFoundException(role_id)
