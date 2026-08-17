import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Request, status

from app.core.api.controlled_rate_limiter import ConfigurableRateLimiter
from app.core.deps import DBSessionDep
from app.device.dependencies.services import DeviceServiceDep
from app.device.host_identity import get_host_identity
from app.device.http import handle_device_errors
from app.device.schemas.device import (
    DeviceCreate,
    DeviceDTO,
    DeviceUpdate,
    SlaveRegisterRequest,
    SlaveRegisterResponse,
)
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(prefix="/devices", tags=["Devices"])

# Per-IP limiter for the only unauthenticated write surface. fastapi-limiter
# is not a project dependency; this in-memory stand-in matches the spec name.
_slave_register_limiter = ConfigurableRateLimiter(times=30, seconds=60)


@router.get("", response_model=List[DeviceDTO])
@handle_device_errors
async def list_devices(
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
    skip: int = 0,
    limit: int = 100,
) -> List[DeviceDTO]:
    return await service.list_devices(db=db, skip=skip, limit=limit, actor=actor)


@router.post("", response_model=DeviceDTO, status_code=status.HTTP_201_CREATED)
@handle_device_errors
async def create_device(
    device_in: DeviceCreate,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("manage_slave_device"))],
) -> DeviceDTO:
    return await service.create_device(db=db, obj_in=device_in, actor=actor)


@router.post(
    "/register-slave",
    response_model=SlaveRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
@handle_device_errors
async def register_slave(
    body: SlaveRegisterRequest,
    request: Request,
    db: DBSessionDep,
    service: DeviceServiceDep,
    _: Annotated[None, Depends(_slave_register_limiter)],
) -> SlaveRegisterResponse:
    client_ip: Optional[str] = request.client.host if request.client else None
    return await service.register_slave(db=db, obj_in=body, client_ip=client_ip)


@router.get("/current")
async def get_current_host_device() -> dict:
    """Unauthenticated identity of the machine running this API."""
    return {
        "code": 200,
        "message": None,
        "data": get_host_identity(),
    }


@router.get("/{id}", response_model=DeviceDTO)
@handle_device_errors
async def get_device(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> DeviceDTO:
    return await service.get_by_id(db=db, device_id=id, actor=actor)


@router.patch("/{id}", response_model=DeviceDTO)
@handle_device_errors
async def update_device(
    id: uuid.UUID,
    device_in: DeviceUpdate,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("edit_device_settings"))],
) -> DeviceDTO:
    return await service.update_device(
        db=db, device_id=id, obj_in=device_in, actor=actor
    )


@router.delete("/{id}", response_model=DeviceDTO)
@handle_device_errors
async def delete_device(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("factory_reset_device"))],
) -> DeviceDTO:
    return await service.delete_device(db=db, device_id=id, actor=actor)
