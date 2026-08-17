import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.seed import ROLE_ADMIN, ROLE_OPERATOR
from tests.device.conftest import auth_header, create_user


async def _create_company_branch(client: AsyncClient) -> tuple[str, str]:
    company_res = await client.post(
        "/v1/companies",
        json={"company_name": "Route Device Co"},
    )
    assert company_res.status_code == 201
    company_id = company_res.json()["company_id"]
    branch_res = await client.post(
        f"/v1/companies/{company_id}/branches",
        json={"branch_name": "HQ", "company_id": company_id},
    )
    assert branch_res.status_code == 201
    return company_id, branch_res.json()["branch_id"]


@pytest.mark.asyncio
async def test_device_routes_crud(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(db_session, uuid.UUID(company_id), email="owner.dev@example.com")
    headers = await auth_header(db_session, "owner.dev@example.com")

    create_res = await async_client.post(
        "/v1/devices",
        headers=headers,
        json={
            "device_name": "Route NVR",
            "ip": "192.168.10.1",
            "serial_no": "ATM-RTE-0001",
            "mac_id": "AA:BB:CC:99:00:01",
            "branch_id": branch_id,
        },
    )
    assert create_res.status_code == 201
    data = create_res.json()
    device_id = data["device_id"]
    assert data["device_role"] == "slave"
    assert data["status"] == "Inactive"
    assert data["current_assignment"]["approval_status"] == "pending_approval"
    assert data["current_assignment"]["company_id"] == company_id

    get_res = await async_client.get(f"/v1/devices/{device_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["device_name"] == "Route NVR"

    list_res = await async_client.get("/v1/devices", headers=headers)
    assert list_res.status_code == 200
    assert any(row["device_id"] == device_id for row in list_res.json())

    patch_res = await async_client.patch(
        f"/v1/devices/{device_id}",
        headers=headers,
        json={"device_name": "Route NVR Updated"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["device_name"] == "Route NVR Updated"

    del_res = await async_client.delete(f"/v1/devices/{device_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_deleted"] is True


@pytest.mark.asyncio
async def test_device_not_found(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, _branch_id = await _create_company_branch(async_client)
    await create_user(db_session, uuid.UUID(company_id), email="owner.nf@example.com")
    headers = await auth_header(db_session, "owner.nf@example.com")
    res = await async_client.get(f"/v1/devices/{uuid.uuid4()}", headers=headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_unauthenticated_device_list_is_rejected(
    async_client: AsyncClient,
) -> None:
    res = await async_client.get("/v1/devices")
    assert res.status_code in {401, 403}


@pytest.mark.asyncio
async def test_admin_can_register_but_not_factory_reset(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(
        db_session,
        uuid.UUID(company_id),
        email="admin.dev@example.com",
        role_id=ROLE_ADMIN,
    )
    headers = await auth_header(db_session, "admin.dev@example.com")
    create_res = await async_client.post(
        "/v1/devices",
        headers=headers,
        json={
            "device_name": "Admin NVR",
            "ip": "192.168.10.2",
            "serial_no": "ATM-ADM-0001",
            "mac_id": "AA:BB:CC:99:00:02",
            "branch_id": branch_id,
        },
    )
    assert create_res.status_code == 201
    device_id = create_res.json()["device_id"]

    role_res = await async_client.patch(
        f"/v1/devices/{device_id}",
        headers=headers,
        json={"device_role": "master"},
    )
    assert role_res.status_code == 403

    del_res = await async_client.delete(f"/v1/devices/{device_id}", headers=headers)
    assert del_res.status_code == 403


@pytest.mark.asyncio
async def test_operator_cannot_register_device(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(
        db_session,
        uuid.UUID(company_id),
        email="operator.dev@example.com",
        role_id=ROLE_OPERATOR,
    )
    headers = await auth_header(db_session, "operator.dev@example.com")
    res = await async_client.post(
        "/v1/devices",
        headers=headers,
        json={
            "device_name": "Operator NVR",
            "ip": "192.168.10.3",
            "serial_no": "ATM-OPR-0001",
            "mac_id": "AA:BB:CC:99:00:03",
            "branch_id": branch_id,
        },
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_device_is_hidden(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_a, branch_a = await _create_company_branch(async_client)
    company_b, _branch_b = await _create_company_branch(async_client)
    await create_user(db_session, uuid.UUID(company_a), email="owner.a@example.com")
    await create_user(db_session, uuid.UUID(company_b), email="owner.b@example.com")
    headers_a = await auth_header(db_session, "owner.a@example.com")
    headers_b = await auth_header(db_session, "owner.b@example.com")

    created = await async_client.post(
        "/v1/devices",
        headers=headers_a,
        json={
            "device_name": "Tenant A NVR",
            "ip": "192.168.11.1",
            "serial_no": "ATM-TEN-A001",
            "mac_id": "AA:BB:CC:AA:00:01",
            "branch_id": branch_a,
        },
    )
    assert created.status_code == 201
    device_id = created.json()["device_id"]

    get_b = await async_client.get(f"/v1/devices/{device_id}", headers=headers_b)
    assert get_b.status_code == 404

    list_b = await async_client.get("/v1/devices", headers=headers_b)
    assert list_b.status_code == 200
    assert all(row["device_id"] != device_id for row in list_b.json())
