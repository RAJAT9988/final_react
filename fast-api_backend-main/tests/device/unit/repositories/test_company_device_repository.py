import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from tests.device.conftest import create_company_and_branch


@pytest.mark.asyncio
async def test_company_device_current_and_pending(
    db_session: AsyncSession,
) -> None:
    company, branch = await create_company_and_branch(db_session)
    device = await DeviceRepository().create(
        db_session,
        {
            "device_name": "Assigned Device",
            "ip": "10.0.0.2",
            "device_role": "slave",
            "status": "Inactive",
            "serial_no": "ATM-REPO-0002",
            "mac_id": "AA:BB:CC:11:22:02",
        },
    )
    repo = CompanyDeviceRepository()
    assignment = await repo.create(
        db_session,
        {
            "device_id": device.device_id,
            "company_id": company.company_id,
            "branch_id": branch.branch_id,
            "approval_status": "pending_approval",
        },
    )
    current = await repo.get_current_by_device_id(db_session, device.device_id)
    assert current is not None
    assert current.company_device_id == assignment.company_device_id

    pending = await repo.list_pending_by_branch_id(db_session, branch.branch_id)
    assert len(pending) == 1
    assert pending[0].company_device_id == assignment.company_device_id
