import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.repositories.camera import CameraRepository
from tests.device.conftest import create_company_and_branch
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository


@pytest.mark.asyncio
async def test_camera_repository_crud(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    device = await DeviceRepository().create(
        db_session,
        {
            "device_name": "Cam Host",
            "ip": "10.0.1.1",
            "device_role": "slave",
            "status": "Active",
            "serial_no": "ATM-CAM-REPO-1",
            "mac_id": "AA:BB:CC:55:00:01",
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
    repo = CameraRepository()
    camera = await repo.create(
        db_session,
        {
            "camera_name": "Lobby Cam",
            "company_device_id": assignment.company_device_id,
            "camera_type": "RTSP",
            "rtsp_url": "rtsp://10.0.1.1/stream",
            "camera_status": "online",
        },
    )
    assert camera.camera_id is not None
    fetched = await repo.get_by_id(db_session, camera.camera_id)
    assert fetched is not None
    assert fetched.camera_name == "Lobby Cam"

    listed = await repo.list_by_company_device_id(
        db_session, assignment.company_device_id
    )
    assert len(listed) == 1

    deleted = await repo.soft_delete(db_session, fetched)
    assert deleted.is_deleted is True
    assert await repo.get_by_id(db_session, camera.camera_id) is None
    assert await repo.get_by_id(db_session, uuid.uuid4()) is None
