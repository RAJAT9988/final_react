from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_health import DeviceHealthRepository
from tests.device.conftest import create_company_and_branch


@pytest.mark.asyncio
async def test_device_health_latest_snapshot(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    device = await DeviceRepository().create(
        db_session,
        {
            "device_name": "Health Device",
            "ip": "10.0.0.3",
            "device_role": "slave",
            "status": "Active",
            "serial_no": "ATM-REPO-0003",
            "mac_id": "AA:BB:CC:11:22:03",
        },
    )
    assignment = await CompanyDeviceRepository().create(
        db_session,
        {
            "device_id": device.device_id,
            "company_id": company.company_id,
            "branch_id": branch.branch_id,
            "approval_status": "approved",
        },
    )
    repo = DeviceHealthRepository()
    older = await repo.create(
        db_session,
        {
            "company_device_id": assignment.company_device_id,
            "cpu_usage": 10.0,
            "npu_usage": 1.0,
            "ram": 20.0,
            "temperature": 30.0,
        },
    )
    older.created_at = datetime.now(timezone.utc) - timedelta(seconds=30)
    await db_session.flush()
    latest_created = await repo.create(
        db_session,
        {
            "company_device_id": assignment.company_device_id,
            "cpu_usage": 42.5,
            "npu_usage": 15.2,
            "ram": 63.0,
            "temperature": 47.8,
        },
    )
    latest_created.created_at = datetime.now(timezone.utc)
    await db_session.flush()
    latest = await repo.get_latest_by_company_device_id(
        db_session, assignment.company_device_id
    )
    assert latest is not None
    assert latest.device_health_id == latest_created.device_health_id
    assert latest.cpu_usage == 42.5
