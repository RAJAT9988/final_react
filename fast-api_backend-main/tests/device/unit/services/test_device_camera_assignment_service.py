import uuid
from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.exceptions import DeviceNotApprovedException
from app.device.schemas.device_camera_assignment import DeviceCameraAssignmentCreate
from tests.device.conftest import (
    FakeCameraGateway,
    build_assignment_service,
    build_company_device_service,
    build_device_service,
    create_company_and_branch,
    device_create_payload,
    make_actor,
)


@pytest.mark.asyncio
async def test_assignment_create_blocked_until_approved(
    db_session: AsyncSession,
) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    assignment_service = build_assignment_service()
    created = await device_service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    camera_id = uuid.uuid4()
    gateway = FakeCameraGateway({camera_id})
    payload = DeviceCameraAssignmentCreate(
        camera_id=camera_id,
        confidence_threshold=0.75,
        status="running",
        start_date=date(2026, 2, 10),
    )
    with pytest.raises(DeviceNotApprovedException):
        await assignment_service.create_assignment(
            db_session, created.device_id, payload, gateway, actor
        )

    await cd_service.approve(db_session, created.device_id, actor=actor)
    assigned = await assignment_service.create_assignment(
        db_session, created.device_id, payload, gateway, actor
    )
    assert assigned.camera_id == camera_id
    assert assigned.status == "running"
