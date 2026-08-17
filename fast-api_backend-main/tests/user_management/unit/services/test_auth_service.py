import pytest
import pyotp
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.exceptions import (
    CompanyHasUsersException,
    InvalidCredentialsException,
    InvalidRoleAssignmentException,
    RefreshTokenReuseDetectedException,
)
from app.user_management.repositories.refresh_token import RefreshTokenRepository
from app.user_management.schemas.auth import RegisterRequest
from app.user_management.schemas.user import UserCreate
from app.user_management.seed import ROLE_ADMIN, ROLE_OWNER
from tests.user_management.conftest import (
    build_auth_service,
    build_user_service,
    create_user,
    user_dto_for,
)


@pytest.mark.asyncio
async def test_auth_register_first_owner_then_block(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    service = build_auth_service()
    owner = await service.register(
        db_session,
        RegisterRequest(
            company_id=company_id,
            name="Owner",
            email="first@example.com",
            password="Password123",
        ),
    )
    assert owner.role_id == ROLE_OWNER
    with pytest.raises(CompanyHasUsersException):
        await service.register(
            db_session,
            RegisterRequest(
                company_id=company_id,
                name="Second",
                email="second@example.com",
                password="Password123",
            ),
        )


@pytest.mark.asyncio
async def test_auth_login_and_refresh_rotate(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    auth = build_auth_service()
    await create_user(db_session, company_id, email="login@example.com")
    tokens = await auth.login(db_session, "login@example.com", "Password123")
    assert tokens.mfa_required is False
    assert tokens.access_token
    assert tokens.refresh_token

    rotated = await auth.refresh(db_session, tokens.refresh_token or "")
    assert rotated.refresh_token
    assert rotated.refresh_token != tokens.refresh_token

    with pytest.raises(RefreshTokenReuseDetectedException):
        await auth.refresh(db_session, tokens.refresh_token or "")

    with pytest.raises(
        (RefreshTokenReuseDetectedException, InvalidCredentialsException)
    ):
        await auth.refresh(db_session, rotated.refresh_token or "")


@pytest.mark.asyncio
async def test_auth_login_2fa_challenge(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    auth = build_auth_service()
    user = await create_user(db_session, company_id, email="mfa@example.com")
    actor = await user_dto_for(db_session, user)
    secret, _uri = await auth.enable_2fa(db_session, actor)
    await auth.confirm_2fa(db_session, actor, pyotp.TOTP(secret).now())

    challenge = await auth.login(db_session, "mfa@example.com", "Password123")
    assert challenge.mfa_required is True
    assert challenge.challenge_token
    assert challenge.access_token is None

    completed = await auth.verify_2fa(
        db_session, challenge.challenge_token, pyotp.TOTP(secret).now()
    )
    assert completed.access_token


@pytest.mark.asyncio
async def test_auth_bad_password(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    auth = build_auth_service()
    await create_user(db_session, company_id, email="badpw@example.com")
    with pytest.raises(InvalidCredentialsException):
        await auth.login(db_session, "badpw@example.com", "wrong-password")


@pytest.mark.asyncio
async def test_admin_role_restriction_via_user_service(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    users = build_user_service()
    admin = await create_user(
        db_session, company_id, email="adm@example.com", role_id=ROLE_ADMIN
    )
    actor = await user_dto_for(db_session, admin)
    with pytest.raises(InvalidRoleAssignmentException):
        await users.add_user(
            db_session,
            actor,
            company_id,
            UserCreate(
                name="Nope",
                email="nope@example.com",
                password="Password123",
                role_id=ROLE_OWNER,
            ),
        )


@pytest.mark.asyncio
async def test_force_logout_revokes_refresh(
    db_session: AsyncSession, rbac: None, company_id
) -> None:
    auth = build_auth_service()
    users = build_user_service()
    owner = await create_user(db_session, company_id, email="out@example.com")
    tokens = await auth.login(db_session, "out@example.com", "Password123")
    actor = await user_dto_for(db_session, owner)
    target = await create_user(
        db_session, company_id, email="victim@example.com", role_id=ROLE_ADMIN
    )
    victim_tokens = await auth.login(db_session, "victim@example.com", "Password123")
    await users.force_logout(db_session, actor, target.user_id)
    assert (
        await RefreshTokenRepository().list_active_by_user(db_session, target.user_id)
        == []
    )
    assert tokens.refresh_token
    assert victim_tokens.refresh_token
