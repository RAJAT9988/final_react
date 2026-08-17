import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.seed import ROLE_ADMIN, ROLE_OPERATOR
from tests.user_management.conftest import build_auth_service, create_user


async def _auth_header(
    db_session: AsyncSession, email: str, password: str = "Password123"
) -> dict[str, str]:
    tokens = await build_auth_service().login(db_session, email, password)
    return {"Authorization": f"Bearer {tokens.access_token}"}


@pytest.mark.asyncio
async def test_company_user_crud_and_admin_restriction(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    await create_user(db_session, company_id, email="owner.users@example.com")
    owner_headers = await _auth_header(db_session, "owner.users@example.com")

    created = await async_client.post(
        f"/v1/companies/{company_id}/users",
        headers=owner_headers,
        json={
            "name": "Admin",
            "email": "admin.users@example.com",
            "password": "Password123",
            "role_id": ROLE_ADMIN,
        },
    )
    assert created.status_code == 201
    admin_id = created.json()["user_id"]

    listed = await async_client.get(
        f"/v1/companies/{company_id}/users", headers=owner_headers
    )
    assert listed.status_code == 200
    assert len(listed.json()) >= 2

    fetched = await async_client.get(f"/v1/users/{admin_id}", headers=owner_headers)
    assert fetched.status_code == 200

    patched = await async_client.patch(
        f"/v1/users/{admin_id}",
        headers=owner_headers,
        json={"name": "Admin Updated"},
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Admin Updated"

    admin_headers = await _auth_header(db_session, "admin.users@example.com")
    forbidden = await async_client.post(
        f"/v1/companies/{company_id}/users",
        headers=admin_headers,
        json={
            "name": "Nope",
            "email": "nope.users@example.com",
            "password": "Password123",
            "role_id": 1,
        },
    )
    assert forbidden.status_code == 403

    allowed = await async_client.post(
        f"/v1/companies/{company_id}/users",
        headers=admin_headers,
        json={
            "name": "Op",
            "email": "op.users@example.com",
            "password": "Password123",
            "role_id": ROLE_OPERATOR,
        },
    )
    assert allowed.status_code == 201
    op_id = allowed.json()["user_id"]

    disabled = await async_client.post(
        f"/v1/users/{op_id}/disable", headers=owner_headers
    )
    assert disabled.status_code == 200
    assert disabled.json()["status"] == "disabled"

    enabled = await async_client.post(
        f"/v1/users/{op_id}/enable", headers=owner_headers
    )
    assert enabled.status_code == 200
    assert enabled.json()["status"] == "active"

    logout = await async_client.post(
        f"/v1/users/{op_id}/force-logout", headers=owner_headers
    )
    assert logout.status_code == 200

    deleted = await async_client.delete(f"/v1/users/{op_id}", headers=owner_headers)
    assert deleted.status_code == 200
    assert deleted.json()["is_deleted"] is True

    admin_delete = await async_client.delete(
        f"/v1/users/{admin_id}", headers=admin_headers
    )
    assert admin_delete.status_code == 403
