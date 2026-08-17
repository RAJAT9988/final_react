import pytest
import pyotp
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.seed import ROLE_OWNER
from tests.user_management.conftest import create_user


@pytest.mark.asyncio
async def test_register_login_refresh_and_2fa(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    register = await async_client.post(
        "/v1/auth/register",
        json={
            "company_id": str(company_id),
            "name": "Owner",
            "email": "owner.api@example.com",
            "password": "Password123",
        },
    )
    assert register.status_code == 201
    assert register.json()["role_id"] == ROLE_OWNER

    second = await async_client.post(
        "/v1/auth/register",
        json={
            "company_id": str(company_id),
            "name": "Other",
            "email": "other.api@example.com",
            "password": "Password123",
        },
    )
    assert second.status_code == 403

    login = await async_client.post(
        "/v1/auth/login",
        json={"email": "owner.api@example.com", "password": "Password123"},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["mfa_required"] is False
    access = body["access_token"]
    refresh = body["refresh_token"]

    rotated = await async_client.post(
        "/v1/auth/refresh-token", json={"refresh_token": refresh}
    )
    assert rotated.status_code == 200
    reuse = await async_client.post(
        "/v1/auth/refresh-token", json={"refresh_token": refresh}
    )
    assert reuse.status_code == 401

    enable = await async_client.post(
        "/v1/auth/2fa/enable",
        headers={"Authorization": f"Bearer {rotated.json()['access_token']}"},
    )
    assert enable.status_code == 200
    secret = enable.json()["secret"]
    confirm = await async_client.post(
        "/v1/auth/2fa/confirm",
        headers={"Authorization": f"Bearer {rotated.json()['access_token']}"},
        json={"code": pyotp.TOTP(secret).now()},
    )
    assert confirm.status_code == 200
    assert confirm.json()["mfa_enabled"] is True

    challenged = await async_client.post(
        "/v1/auth/login",
        json={"email": "owner.api@example.com", "password": "Password123"},
    )
    assert challenged.status_code == 200
    assert challenged.json()["mfa_required"] is True
    verified = await async_client.post(
        "/v1/auth/login/verify-2fa",
        json={
            "challenge_token": challenged.json()["challenge_token"],
            "code": pyotp.TOTP(secret).now(),
        },
    )
    assert verified.status_code == 200
    assert verified.json()["access_token"]
    assert access


@pytest.mark.asyncio
async def test_login_invalid_password(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    await create_user(db_session, company_id, email="api.bad@example.com")
    response = await async_client.post(
        "/v1/auth/login",
        json={"email": "api.bad@example.com", "password": "nope"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_restore_and_reset_password(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    await create_user(db_session, company_id, email="reset.api@example.com")
    restore = await async_client.post(
        "/v1/auth/restore-password",
        json={"email": "reset.api@example.com"},
    )
    assert restore.status_code == 200
    raw_token = restore.json()["reset_token"]
    assert raw_token

    reset = await async_client.post(
        "/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword123"},
    )
    assert reset.status_code == 204

    old_login = await async_client.post(
        "/v1/auth/login",
        json={"email": "reset.api@example.com", "password": "Password123"},
    )
    assert old_login.status_code == 401

    new_login = await async_client.post(
        "/v1/auth/login",
        json={"email": "reset.api@example.com", "password": "NewPassword123"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["access_token"]
