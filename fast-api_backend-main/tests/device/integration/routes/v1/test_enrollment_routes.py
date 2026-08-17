from datetime import date
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.device.conftest import auth_header, create_user


async def _create_company_branch(client: AsyncClient) -> tuple[str, str]:
    company_res = await client.post(
        "/v1/companies",
        json={"company_name": "Enrollment Co"},
    )
    assert company_res.status_code == 201
    company_id = company_res.json()["company_id"]
    branch_res = await client.post(
        f"/v1/companies/{company_id}/branches",
        json={"branch_name": "Main", "company_id": company_id},
    )
    assert branch_res.status_code == 201
    return company_id, branch_res.json()["branch_id"]


async def _register_device(
    client: AsyncClient,
    headers: dict[str, str],
    branch_id: str,
    serial_no: str,
    mac_id: str,
    name: str,
) -> dict:
    res = await client.post(
        "/v1/devices",
        headers=headers,
        json={
            "device_name": name,
            "ip": "192.168.20.1",
            "serial_no": serial_no,
            "mac_id": mac_id,
            "branch_id": branch_id,
        },
    )
    assert res.status_code == 201
    return res.json()


@pytest.mark.asyncio
async def test_pending_list_approve_and_reject(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(db_session, UUID(company_id), email="owner.enr@example.com")
    headers = await auth_header(db_session, "owner.enr@example.com")
    device = await _register_device(
        async_client,
        headers,
        branch_id,
        "ATM-ENR-0001",
        "AA:BB:CC:20:00:01",
        "Pending Unit",
    )
    pending_res = await async_client.get(
        f"/v1/branches/{branch_id}/devices/pending-approval",
        headers=headers,
    )
    assert pending_res.status_code == 200
    pending_ids = [row["device_id"] for row in pending_res.json()]
    assert device["device_id"] in pending_ids

    approve_res = await async_client.post(
        f"/v1/devices/{device['device_id']}/approve",
        headers=headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "Active"
    assert approve_res.json()["current_assignment"]["approval_status"] == "approved"

    after = await async_client.get(
        f"/v1/branches/{branch_id}/devices/pending-approval",
        headers=headers,
    )
    assert device["device_id"] not in [row["device_id"] for row in after.json()]

    other = await _register_device(
        async_client,
        headers,
        branch_id,
        "ATM-ENR-0002",
        "AA:BB:CC:20:00:02",
        "Reject Unit",
    )
    reject_res = await async_client.post(
        f"/v1/devices/{other['device_id']}/reject",
        headers=headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["current_assignment"]["approval_status"] == "rejected"


@pytest.mark.asyncio
async def test_multi_master_per_branch_via_routes(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(db_session, UUID(company_id), email="owner.mst@example.com")
    headers = await auth_header(db_session, "owner.mst@example.com")
    first = await _register_device(
        async_client,
        headers,
        branch_id,
        "ATM-MST-R1",
        "AA:BB:CC:30:00:01",
        "Master One",
    )
    second = await _register_device(
        async_client,
        headers,
        branch_id,
        "ATM-MST-R2",
        "AA:BB:CC:30:00:02",
        "Master Two",
    )
    assert (
        await async_client.post(
            f"/v1/devices/{first['device_id']}/approve", headers=headers
        )
    ).status_code == 200
    assert (
        await async_client.post(
            f"/v1/devices/{second['device_id']}/approve", headers=headers
        )
    ).status_code == 200
    assert (
        await async_client.patch(
            f"/v1/devices/{first['device_id']}",
            headers=headers,
            json={"device_role": "master"},
        )
    ).status_code == 200
    assert (
        await async_client.patch(
            f"/v1/devices/{second['device_id']}",
            headers=headers,
            json={"device_role": "master"},
        )
    ).status_code == 200
    listed = await async_client.get(
        f"/v1/branches/{branch_id}/devices", headers=headers
    )
    assert listed.status_code == 200
    masters = [row for row in listed.json() if row["device_role"] == "master"]
    assert len(masters) == 2


@pytest.mark.asyncio
async def test_approval_gate_blocks_assignment_and_subscription(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_id, branch_id = await _create_company_branch(async_client)
    await create_user(db_session, UUID(company_id), email="owner.gate@example.com")
    headers = await auth_header(db_session, "owner.gate@example.com")
    device = await _register_device(
        async_client,
        headers,
        branch_id,
        "ATM-GATE-0001",
        "AA:BB:CC:40:00:01",
        "Gate Unit",
    )
    company_device_id = device["current_assignment"]["company_device_id"]
    camera_res = await async_client.post(
        "/v1/cameras",
        headers=headers,
        json={
            "camera_name": "Gate Cam",
            "company_device_id": company_device_id,
            "camera_type": "RTSP",
            "rtsp_url": "rtsp://192.168.20.1/stream",
            "camera_status": "online",
        },
    )
    assert camera_res.status_code == 201
    camera_id = camera_res.json()["camera_id"]

    assign_res = await async_client.post(
        f"/v1/devices/{device['device_id']}/camera-assignments",
        headers=headers,
        json={
            "camera_id": camera_id,
            "confidence_threshold": 0.7,
            "status": "running",
            "start_date": str(date(2026, 2, 10)),
        },
    )
    assert assign_res.status_code == 403

    sub_res = await async_client.post(
        f"/v1/devices/{device['device_id']}/model-subscriptions",
        headers=headers,
        json={
            "model_id": "person",
            "subscription_key": "enc:gate-key",
            "is_enabled": True,
            "start_date": str(date(2026, 2, 10)),
            "end_date": str(date(2027, 2, 10)),
        },
    )
    assert sub_res.status_code == 403

    approve_res = await async_client.post(
        f"/v1/devices/{device['device_id']}/approve",
        headers=headers,
    )
    assert approve_res.status_code == 200

    assign_ok = await async_client.post(
        f"/v1/devices/{device['device_id']}/camera-assignments",
        headers=headers,
        json={
            "camera_id": camera_id,
            "confidence_threshold": 0.7,
            "status": "running",
            "start_date": str(date(2026, 2, 10)),
        },
    )
    assert assign_ok.status_code == 201

    sub_ok = await async_client.post(
        f"/v1/devices/{device['device_id']}/model-subscriptions",
        headers=headers,
        json={
            "model_id": "person",
            "subscription_key": "enc:gate-key",
            "is_enabled": True,
            "start_date": str(date(2026, 2, 10)),
            "end_date": str(date(2027, 2, 10)),
        },
    )
    assert sub_ok.status_code == 201
    assert "subscription_key" not in sub_ok.json()
