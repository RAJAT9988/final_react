import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.repositories.company_branch import CompanyBranchRepository
from app.device.schemas.company_device import DeviceReassign
from app.device.schemas.device import DeviceUpdate
from tests.device.conftest import (
    build_company_device_service,
    build_device_service,
    create_company_and_branch,
    device_create_payload,
    make_actor,
)


@pytest.mark.asyncio
async def test_approve_sets_active(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    created = await device_service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    approved = await cd_service.approve(db_session, created.device_id, actor=actor)
    assert approved.status == "Active"
    assert approved.current_assignment is not None
    assert approved.current_assignment.approval_status == "approved"
    assert approved.current_assignment.approved_at is not None
    assert approved.current_assignment.approved_by == actor.user_id


@pytest.mark.asyncio
async def test_reject_keeps_inactive_row(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    created = await device_service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    rejected = await cd_service.reject(db_session, created.device_id, actor=actor)
    assert rejected.status == "Inactive"
    assert rejected.current_assignment is not None
    assert rejected.current_assignment.approval_status == "rejected"
    assert rejected.is_deleted is False
    assert rejected.current_assignment.is_deleted is False


@pytest.mark.asyncio
async def test_reassign_creates_new_pending_row(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    created = await device_service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    assert created.current_assignment is not None
    old_assignment_id = created.current_assignment.company_device_id
    await cd_service.approve(db_session, created.device_id, actor=actor)
    new_branch = await CompanyBranchRepository().create(
        db_session,
        {"company_id": company.company_id, "branch_name": "Yard"},
    )
    reassigned = await cd_service.reassign(
        db_session,
        created.device_id,
        DeviceReassign(branch_id=new_branch.branch_id),
        actor,
    )
    assert reassigned.status == "Inactive"
    assert reassigned.current_assignment is not None
    assert reassigned.current_assignment.approval_status == "pending_approval"
    assert reassigned.current_assignment.branch_id == new_branch.branch_id
    assert reassigned.current_assignment.company_device_id != old_assignment_id


@pytest.mark.asyncio
async def test_multi_master_per_branch(db_session: AsyncSession) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    first = await device_service.create_device(
        db_session,
        device_create_payload(
            branch.branch_id,
            serial_no="ATM-MST-A",
            mac_id="AA:BB:CC:00:AA:01",
            device_name="Master A",
        ),
        actor,
    )
    second = await device_service.create_device(
        db_session,
        device_create_payload(
            branch.branch_id,
            serial_no="ATM-MST-B",
            mac_id="AA:BB:CC:00:AA:02",
            device_name="Master B",
        ),
        actor,
    )
    await cd_service.approve(db_session, first.device_id, actor=actor)
    await cd_service.approve(db_session, second.device_id, actor=actor)
    await device_service.update_device(
        db_session, first.device_id, DeviceUpdate(device_role="master"), actor
    )
    await device_service.update_device(
        db_session, second.device_id, DeviceUpdate(device_role="master"), actor
    )
    listed = await device_service.list_devices_by_branch(
        db_session, branch.branch_id, actor=actor
    )
    masters = [row for row in listed if row.device_role == "master"]
    assert len(masters) == 2
    assert {row.device_id for row in masters} == {first.device_id, second.device_id}
