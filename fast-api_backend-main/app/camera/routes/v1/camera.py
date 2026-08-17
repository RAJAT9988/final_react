import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, status

from app.camera.dependencies.services import CameraServiceDep
from app.camera.http import handle_camera_errors
from app.camera.schemas.camera import (
    CameraCreate,
    CameraDTO,
    CameraStatusUpdate,
    CameraUpdate,
)
from app.core.deps import DBSessionDep
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(tags=["Cameras"])


@router.get("/cameras", response_model=List[CameraDTO])
@handle_camera_errors
async def list_cameras(
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_camera_list"))],
    skip: int = 0,
    limit: int = 100,
    company_device_id: Optional[uuid.UUID] = None,
    zone: Optional[str] = None,
    department: Optional[str] = None,
    camera_group: Optional[str] = None,
    camera_status: Optional[str] = None,
) -> List[CameraDTO]:
    return await service.list_cameras(
        db=db,
        skip=skip,
        limit=limit,
        company_device_id=company_device_id,
        zone=zone,
        department=department,
        camera_group=camera_group,
        camera_status=camera_status,
        actor=actor,
    )


@router.post(
    "/cameras",
    response_model=CameraDTO,
    status_code=status.HTTP_201_CREATED,
)
@handle_camera_errors
async def create_camera(
    camera_in: CameraCreate,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("add_camera"))],
) -> CameraDTO:
    return await service.create_camera(db=db, obj_in=camera_in, actor=actor)


@router.get("/cameras/{id}", response_model=CameraDTO)
@handle_camera_errors
async def get_camera(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_camera_list"))],
) -> CameraDTO:
    return await service.get_by_id(db=db, camera_id=id, actor=actor)


@router.patch("/cameras/{id}", response_model=CameraDTO)
@handle_camera_errors
async def update_camera(
    id: uuid.UUID,
    camera_in: CameraUpdate,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("edit_camera"))],
) -> CameraDTO:
    return await service.update_camera(
        db=db, camera_id=id, obj_in=camera_in, actor=actor
    )


@router.patch("/cameras/{id}/status", response_model=CameraDTO)
@handle_camera_errors
async def update_camera_status(
    id: uuid.UUID,
    body: CameraStatusUpdate,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("edit_camera"))],
) -> CameraDTO:
    return await service.update_status(db=db, camera_id=id, obj_in=body, actor=actor)


@router.delete("/cameras/{id}", response_model=CameraDTO)
@handle_camera_errors
async def delete_camera(
    id: uuid.UUID,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("delete_camera"))],
) -> CameraDTO:
    return await service.delete_camera(db=db, camera_id=id, actor=actor)


@router.get(
    "/devices/{company_device_id}/cameras",
    response_model=List[CameraDTO],
)
@handle_camera_errors
async def list_cameras_by_company_device(
    company_device_id: uuid.UUID,
    db: DBSessionDep,
    service: CameraServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_camera_list"))],
) -> List[CameraDTO]:
    return await service.list_by_company_device(
        db=db, company_device_id=company_device_id, actor=actor
    )
