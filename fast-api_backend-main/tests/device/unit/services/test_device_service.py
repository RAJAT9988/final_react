import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.exceptions import DeviceAccessDeniedException, DeviceNotFoundException
from app.device.schemas.device import DeviceUpdate
from tests.device.conftest import (
    build_device_service,
    create_company_and_branch,
    device_create_payload,
    make_actor,
)


@pytest.mark.asyncio
async def test_create_device_starts_slave_inactive_pending(
    db_session: AsyncSession,
) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    service = build_device_service()
    created = await service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    assert created.device_role == "slave"
    assert created.status == "Inactive"
    assert created.current_assignment is not None
    assert created.current_assignment.approval_status == "pending_approval"
    assert created.current_assignment.company_id == company.company_id
    assert created.current_assignment.branch_id == branch.branch_id
    assert created.current_assignment.assign_by == actor.user_id
    assert created.current_assignment.approved_by is None
    assert created.current_assignment.approved_at is None


@pytest.mark.asyncio
async def test_device_service_not_found(db_session: AsyncSession) -> None:
    service = build_device_service()
    with pytest.raises(DeviceNotFoundException):
        await service.get_by_id(db_session, uuid.uuid4())


@pytest.mark.asyncio
async def test_cross_tenant_device_is_not_visible(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    other_company, _other_branch = await create_company_and_branch(db_session)
    owner = make_actor(company.company_id)
    outsider = make_actor(other_company.company_id, email="outsider@example.com")
    service = build_device_service()
    created = await service.create_device(
        db_session, device_create_payload(branch.branch_id), owner
    )
    with pytest.raises(DeviceNotFoundException):
        await service.get_by_id(db_session, created.device_id, actor=outsider)


@pytest.mark.asyncio
async def test_admin_cannot_set_device_role(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    admin = make_actor(company.company_id, role_name="admin")
    service = build_device_service()
    created = await service.create_device(
        db_session, device_create_payload(branch.branch_id), admin
    )
    with pytest.raises(DeviceAccessDeniedException):
        await service.update_device(
            db_session,
            created.device_id,
            DeviceUpdate(device_role="master"),
            admin,
        )
