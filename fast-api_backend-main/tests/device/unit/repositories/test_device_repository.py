import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.repositories.device import DeviceRepository


@pytest.mark.asyncio
async def test_device_repository_crud(db_session: AsyncSession) -> None:
    repo = DeviceRepository()
    device = await repo.create(
        db_session,
        {
            "device_name": "Unit Device",
            "ip": "10.0.0.1",
            "device_role": "slave",
            "status": "Inactive",
            "serial_no": "ATM-REPO-0001",
            "mac_id": "AA:BB:CC:11:22:01",
        },
    )
    assert device.device_id is not None
    assert device.is_deleted is False

    fetched = await repo.get_by_id(db_session, device.device_id)
    assert fetched is not None
    assert fetched.device_name == "Unit Device"

    by_serial = await repo.get_by_serial_no(db_session, "ATM-REPO-0001")
    assert by_serial is not None
    by_mac = await repo.get_by_mac_id(db_session, "AA:BB:CC:11:22:01")
    assert by_mac is not None

    deleted = await repo.soft_delete(db_session, fetched)
    assert deleted.is_deleted is True
    assert await repo.get_by_id(db_session, device.device_id) is None
