import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, status

from app.camera.gateway import CameraGatewayDep
from app.core.deps import DBSessionDep
from app.device.dependencies.services import DeviceCameraAssignmentServiceDep
from app.device.http import handle_device_errors
from app.device.schemas.device_camera_assignment import (
    DeviceCameraAssignmentCreate,
    DeviceCameraAssignmentDTO,
    DeviceCameraAssignmentUpdate,
)
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(tags=["Device Camera Assignments"])


@router.get(
    "/devices/{id}/camera-assignments",
    response_model=List[DeviceCameraAssignmentDTO],
)
@handle_device_errors
async def list_camera_assignments(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceCameraAssignmentServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> List[DeviceCameraAssignmentDTO]:
    return await service.list_by_device(db=db, device_id=id, actor=actor)


@router.post(
    "/devices/{id}/camera-assignments",
    response_model=DeviceCameraAssignmentDTO,
    status_code=status.HTTP_201_CREATED,
)
@handle_device_errors
async def create_camera_assignment(
    id: uuid.UUID,
    body: DeviceCameraAssignmentCreate,
    db: DBSessionDep,
    service: DeviceCameraAssignmentServiceDep,
    camera_gateway: CameraGatewayDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("assign_model_to_camera"))],
) -> DeviceCameraAssignmentDTO:
    return await service.create_assignment(
        db=db,
        device_id=id,
        obj_in=body,
        camera_gateway=camera_gateway,
        actor=actor,
    )


@router.patch(
    "/camera-assignments/{id}",
    response_model=DeviceCameraAssignmentDTO,
)
@handle_device_errors
async def update_camera_assignment(
    id: uuid.UUID,
    body: DeviceCameraAssignmentUpdate,
    db: DBSessionDep,
    service: DeviceCameraAssignmentServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("assign_model_to_camera"))],
) -> DeviceCameraAssignmentDTO:
    return await service.update_assignment(
        db=db, model_assign_id=id, obj_in=body, actor=actor
    )


@router.delete(
    "/camera-assignments/{id}",
    response_model=DeviceCameraAssignmentDTO,
)
@handle_device_errors
async def delete_camera_assignment(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceCameraAssignmentServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("assign_model_to_camera"))],
) -> DeviceCameraAssignmentDTO:
    return await service.delete_assignment(db=db, model_assign_id=id, actor=actor)
