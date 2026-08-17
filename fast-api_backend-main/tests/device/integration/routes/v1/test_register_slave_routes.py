import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_slave_requires_no_authorization(
    async_client: AsyncClient,
) -> None:
    unauthenticated = await async_client.get("/v1/devices")
    assert unauthenticated.status_code in {401, 403}

    res = await async_client.post(
        "/v1/devices/register-slave",
        json={
            "role": "slave",
            "name": "Open Slave",
            "ip": "192.168.40.9",
            "dns_name": "open-slave.local",
            "mac_id": "AA:BB:CC:40:00:09",
            "serial_no": "ATM-SLV-REG-01",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert set(body.keys()) == {"device_id", "approval_status"}
    assert body["approval_status"] == "pending_approval"
    assert "company_id" not in body
    assert "branch_id" not in body
    assert "company_name" not in body
