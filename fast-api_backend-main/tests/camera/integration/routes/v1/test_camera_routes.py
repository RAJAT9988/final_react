from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.camera.conftest import auth_header, create_user


@pytest.mark.asyncio
async def test_camera_routes_crud(
    async_client: AsyncClient,
    db_session: AsyncSession,
    rbac: None,
) -> None:
    company_res = await async_client.post(
        "/v1/companies", json={"company_name": "Camera Co"}
    )
    assert company_res.status_code == 201
    company_id = company_res.json()["company_id"]
    await create_user(db_session, UUID(company_id), email="owner.cam@example.com")
    headers = await auth_header(db_session, "owner.cam@example.com")

    branch_res = await async_client.post(
        f"/v1/companies/{company_id}/branches",
        json={"branch_name": "HQ", "company_id": company_id},
    )
    assert branch_res.status_code == 201
    branch_id = branch_res.json()["branch_id"]
    device_res = await async_client.post(
        "/v1/devices",
        headers=headers,
        json={
            "device_name": "Camera Host",
            "ip": "192.168.50.1",
            "serial_no": "ATM-CAM-RTE-1",
            "mac_id": "AA:BB:CC:50:00:01",
            "branch_id": branch_id,
        },
    )
    assert device_res.status_code == 201
    company_device_id = device_res.json()["current_assignment"]["company_device_id"]

    create_res = await async_client.post(
        "/v1/cameras",
        headers=headers,
        json={
            "camera_name": "Lobby",
            "company_device_id": company_device_id,
            "camera_type": "RTSP",
            "rtsp_url": "rtsp://192.168.50.1/stream",
            "camera_status": "online",
            "location": "Lobby",
            "zone": "A",
            "department": "Security",
            "camera_group": "Entrance",
            "resolution": "1920x1080",
            "fps_limit": 15,
        },
    )
    assert create_res.status_code == 201
    camera_id = create_res.json()["camera_id"]
    assert create_res.json()["camera_name"] == "Lobby"

    get_res = await async_client.get(f"/v1/cameras/{camera_id}", headers=headers)
    assert get_res.status_code == 200

    list_res = await async_client.get("/v1/cameras", headers=headers)
    assert list_res.status_code == 200
    assert any(row["camera_id"] == camera_id for row in list_res.json())

    by_device = await async_client.get(
        f"/v1/devices/{company_device_id}/cameras", headers=headers
    )
    assert by_device.status_code == 200
    assert len(by_device.json()) == 1

    patch_res = await async_client.patch(
        f"/v1/cameras/{camera_id}",
        headers=headers,
        json={"camera_name": "Lobby Updated"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["camera_name"] == "Lobby Updated"

    status_res = await async_client.patch(
        f"/v1/cameras/{camera_id}/status",
        headers=headers,
        json={"camera_status": "offline"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["camera_status"] == "offline"

    del_res = await async_client.delete(f"/v1/cameras/{camera_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_deleted"] is True
