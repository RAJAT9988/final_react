import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends

from app.core.deps import DBSessionDep
from app.device.dependencies.services import CompanyDeviceServiceDep, DeviceServiceDep
from app.device.http import handle_device_errors
from app.device.schemas.company_device import DeviceReassign
from app.device.schemas.device import DeviceDTO
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(tags=["Devices"])


@router.get("/branches/{branch_id}/devices", response_model=List[DeviceDTO])
@handle_device_errors
async def list_devices_by_branch(
    branch_id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> List[DeviceDTO]:
    return await service.list_devices_by_branch(db=db, branch_id=branch_id, actor=actor)


@router.get(
    "/branches/{branch_id}/devices/pending-approval",
    response_model=List[DeviceDTO],
)
@handle_device_errors
async def list_pending_devices_by_branch(
    branch_id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> List[DeviceDTO]:
    return await service.list_devices_by_branch(
        db=db, branch_id=branch_id, pending_only=True, actor=actor
    )


@router.post("/devices/{id}/approve", response_model=DeviceDTO)
@handle_device_errors
async def approve_device(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyDeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("manage_slave_device"))],
) -> DeviceDTO:
    return await service.approve(db=db, device_id=id, actor=actor)


@router.post("/devices/{id}/reject", response_model=DeviceDTO)
@handle_device_errors
async def reject_device(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CompanyDeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("manage_slave_device"))],
) -> DeviceDTO:
    return await service.reject(db=db, device_id=id, actor=actor)


@router.post("/devices/{id}/reassign", response_model=DeviceDTO)
@handle_device_errors
async def reassign_device(
    id: uuid.UUID,
    body: DeviceReassign,
    db: DBSessionDep,
    service: CompanyDeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("reconnect_slave_device"))],
) -> DeviceDTO:
    return await service.reassign(db=db, device_id=id, obj_in=body, actor=actor)
