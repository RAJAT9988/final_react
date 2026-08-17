import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import DBSessionDep
from app.device.dependencies.services import DeviceHealthServiceDep
from app.device.http import handle_device_errors
from app.device.schemas.device_health import DeviceHealthCreate, DeviceHealthDTO
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(prefix="/devices", tags=["Device Health"])


@router.post(
    "/{id}/health",
    response_model=DeviceHealthDTO,
    status_code=status.HTTP_201_CREATED,
)
@handle_device_errors
async def ingest_device_health(
    id: uuid.UUID,
    body: DeviceHealthCreate,
    db: DBSessionDep,
    service: DeviceHealthServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> DeviceHealthDTO:
    return await service.ingest(db=db, device_id=id, obj_in=body, actor=actor)


@router.get("/{id}/health/latest", response_model=DeviceHealthDTO)
@handle_device_errors
async def get_latest_device_health(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceHealthServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> DeviceHealthDTO:
    return await service.get_latest(db=db, device_id=id, actor=actor)
