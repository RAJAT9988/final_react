import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.exceptions import DeviceAlreadyExistsException
from app.device.schemas.device import SlaveRegisterRequest
from tests.device.conftest import build_device_service


def _slave_payload(
    *,
    serial_no: str = "ATM-SLV-SELF-01",
    mac_id: str = "AA:BB:CC:00:FF:11",
) -> SlaveRegisterRequest:
    return SlaveRegisterRequest(
        role="slave",
        name="Self Slave",
        ip="192.168.9.9",
        dns_name="self-slave.local",
        mac_id=mac_id,
        serial_no=serial_no,
    )


@pytest.mark.asyncio
async def test_register_slave_creates_pending_device(
    db_session: AsyncSession,
) -> None:
    service = build_device_service()
    result = await service.register_slave(db_session, _slave_payload())
    assert result.approval_status == "pending_approval"

    created = await service.get_by_id(db_session, result.device_id)
    assert created.device_role == "slave"
    assert created.status == "Inactive"
    assert created.dns_name == "self-slave.local"
    assert created.current_assignment is not None
    assert created.current_assignment.assign_by is None
    assert created.current_assignment.company_id is None
    assert created.current_assignment.branch_id is None
    assert created.current_assignment.approval_status == "pending_approval"


@pytest.mark.asyncio
async def test_register_slave_duplicate_serial_and_mac(
    db_session: AsyncSession,
) -> None:
    service = build_device_service()
    payload = _slave_payload()
    await service.register_slave(db_session, payload)
    with pytest.raises(DeviceAlreadyExistsException):
        await service.register_slave(db_session, payload)
    with pytest.raises(DeviceAlreadyExistsException):
        await service.register_slave(
            db_session,
            _slave_payload(serial_no="ATM-SLV-SELF-02", mac_id=payload.mac_id),
        )
