import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.seed import ROLE_OWNER
from tests.user_management.conftest import build_auth_service, create_user


@pytest.mark.asyncio
async def test_list_roles_and_permissions(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    await create_user(db_session, company_id, email="roles@example.com")
    tokens = await build_auth_service().login(
        db_session, "roles@example.com", "Password123"
    )
    headers = {"Authorization": f"Bearer {tokens.access_token}"}

    roles = await async_client.get("/v1/roles", headers=headers)
    assert roles.status_code == 200
    assert len(roles.json()) == 4

    perms = await async_client.get(
        f"/v1/roles/{ROLE_OWNER}/permissions", headers=headers
    )
    assert perms.status_code == 200
    assert perms.json()["role_name"] == "owner"
    assert len(perms.json()["permissions"]) == 50
