import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_company_routes_crud(async_client: AsyncClient):
    # Create Company
    response = await async_client.post(
        "/v1/companies",
        json={
            "company_name": "Global Tech",
            "contact_person_name": "Alice Johnson",
            "contact_person_email": "alice@globaltech.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    company_id = data["company_id"]
    assert data["company_name"] == "Global Tech"

    # Get Company
    get_res = await async_client.get(f"/v1/companies/{company_id}")
    assert get_res.status_code == 200
    assert get_res.json()["company_name"] == "Global Tech"

    # List Companies
    list_res = await async_client.get("/v1/companies")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Update Company
    patch_res = await async_client.patch(
        f"/v1/companies/{company_id}",
        json={"company_name": "Global Tech Updated"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["company_name"] == "Global Tech Updated"

    # Soft Delete Company
    del_res = await async_client.delete(f"/v1/companies/{company_id}")
    assert del_res.status_code == 200
    assert del_res.json()["is_deleted"] is True
