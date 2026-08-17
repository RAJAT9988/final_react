import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.user_management.conftest import build_auth_service, create_user


@pytest.mark.asyncio
async def test_profile_get_and_patch(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
    company_id,
) -> None:
    await create_user(db_session, company_id, email="profile@example.com", name="Orig")
    tokens = await build_auth_service().login(
        db_session, "profile@example.com", "Password123"
    )
    headers = {"Authorization": f"Bearer {tokens.access_token}"}

    get_res = await async_client.get("/v1/profile", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "profile@example.com"

    patch_res = await async_client.patch(
        "/v1/profile", headers=headers, json={"name": "Updated"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated"


@pytest.mark.asyncio
async def test_profile_requires_auth(async_client: AsyncClient) -> None:
    response = await async_client.get("/v1/profile")
    assert response.status_code in {401, 403}
