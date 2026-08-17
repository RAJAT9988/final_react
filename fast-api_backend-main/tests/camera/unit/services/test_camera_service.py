import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.exceptions import CameraCompanyDeviceNotFoundException
from app.camera.schemas.camera import CameraCreate
from tests.camera.conftest import FakeDeviceGateway, build_camera_service, make_actor


@pytest.mark.asyncio
async def test_camera_service_create_validates_company_device(
    db_session: AsyncSession,
) -> None:
    company_id = uuid.uuid4()
    company_device_id = uuid.uuid4()
    actor = make_actor(company_id)
    service = build_camera_service(
        FakeDeviceGateway({company_device_id}, company_id=company_id)
    )
    created = await service.create_camera(
        db_session,
        CameraCreate(
            camera_name="Front Door",
            company_device_id=company_device_id,
            camera_type="RTSP",
            rtsp_url="rtsp://192.168.1.101/stream1",
            camera_status="online",
        ),
        actor,
    )
    assert created.camera_name == "Front Door"
    assert created.company_device_id == company_device_id

    fetched = await service.get_by_id(db_session, created.camera_id, actor=actor)
    assert fetched.camera_id == created.camera_id


@pytest.mark.asyncio
async def test_camera_service_invalid_company_device(
    db_session: AsyncSession,
) -> None:
    actor = make_actor(uuid.uuid4())
    service = build_camera_service(
        FakeDeviceGateway(set(), company_id=actor.company_id)
    )
    with pytest.raises(CameraCompanyDeviceNotFoundException):
        await service.create_camera(
            db_session,
            CameraCreate(
                camera_name="Orphan Cam",
                company_device_id=uuid.uuid4(),
                camera_type="USB",
                camera_status="offline",
            ),
            actor,
        )
