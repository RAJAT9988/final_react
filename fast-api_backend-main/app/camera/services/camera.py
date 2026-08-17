import uuid
from typing import Any, List, Optional, Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.camera.constants import CAMERA_STATUSES, CAMERA_TYPES
from app.camera.events import CameraDeleted, CameraRegistered, CameraStatusChanged
from app.camera.exceptions import (
    CameraCompanyDeviceNotFoundException,
    CameraNotFoundException,
    InvalidCameraStatusException,
    InvalidCameraTypeException,
)
from app.camera.repositories.camera import CameraRepository
from app.camera.schemas.camera import (
    CameraCreate,
    CameraDTO,
    CameraStatusUpdate,
    CameraUpdate,
)
from app.user_management.schemas.user import UserDTO


class CompanyDeviceLookup(Protocol):
    """Minimal DeviceGateway surface used when creating cameras."""

    async def get_company_device(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> Any: ...

    async def get_devices_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> Any: ...


class CameraService:
    """Camera CRUD; validates company_device via DeviceGateway."""

    def __init__(
        self,
        camera_repo: CameraRepository,
        device_gateway: CompanyDeviceLookup,
    ) -> None:
        self.camera_repo = camera_repo
        self.device_gateway = device_gateway

    async def _require_company_device(
        self,
        db: AsyncSession,
        company_device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
    ) -> Any:
        try:
            assignment = await self.device_gateway.get_company_device(
                db, company_device_id
            )
        except Exception as exc:
            raise CameraCompanyDeviceNotFoundException(company_device_id) from exc
        assignment_company_id = getattr(assignment, "company_id", None)
        if actor is not None and assignment_company_id != actor.company_id:
            raise CameraCompanyDeviceNotFoundException(company_device_id)
        return assignment

    async def _allowed_company_device_ids(
        self, db: AsyncSession, actor: UserDTO
    ) -> List[uuid.UUID]:
        devices = await self.device_gateway.get_devices_by_company(db, actor.company_id)
        return [
            device.current_assignment.company_device_id
            for device in devices
            if getattr(device, "current_assignment", None) is not None
        ]

    async def get_by_id(
        self,
        db: AsyncSession,
        camera_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
    ) -> CameraDTO:
        camera = await self.camera_repo.get_by_id(db, camera_id)
        if not camera:
            raise CameraNotFoundException(camera_id)
        if actor is not None:
            await self._require_company_device(db, camera.company_device_id, actor)
        return CameraDTO.model_validate(camera)

    async def list_cameras(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        company_device_id: Optional[uuid.UUID] = None,
        zone: Optional[str] = None,
        department: Optional[str] = None,
        camera_group: Optional[str] = None,
        camera_status: Optional[str] = None,
        actor: Optional[UserDTO] = None,
    ) -> List[CameraDTO]:
        allowed_ids: Optional[List[uuid.UUID]] = None
        if actor is not None:
            allowed_ids = await self._allowed_company_device_ids(db, actor)
            if company_device_id is not None:
                if company_device_id not in allowed_ids:
                    raise CameraCompanyDeviceNotFoundException(company_device_id)
                allowed_ids = [company_device_id]
                company_device_id = None
            elif not allowed_ids:
                return []
        cameras = await self.camera_repo.get_active_cameras(
            db,
            skip=skip,
            limit=limit,
            company_device_id=company_device_id,
            company_device_ids=allowed_ids,
            zone=zone,
            department=department,
            camera_group=camera_group,
            camera_status=camera_status,
        )
        return [CameraDTO.model_validate(camera) for camera in cameras]

    async def list_by_company_device(
        self,
        db: AsyncSession,
        company_device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
    ) -> List[CameraDTO]:
        await self._require_company_device(db, company_device_id, actor)
        cameras = await self.camera_repo.list_by_company_device_id(
            db, company_device_id
        )
        return [CameraDTO.model_validate(camera) for camera in cameras]

    async def create_camera(
        self, db: AsyncSession, obj_in: CameraCreate, actor: UserDTO
    ) -> CameraDTO:
        if obj_in.camera_type not in CAMERA_TYPES:
            raise InvalidCameraTypeException(obj_in.camera_type)
        if obj_in.camera_status not in CAMERA_STATUSES:
            raise InvalidCameraStatusException(obj_in.camera_status)
        await self._require_company_device(db, obj_in.company_device_id, actor)
        camera = await self.camera_repo.create(db, obj_in.model_dump())
        dto = CameraDTO.model_validate(camera)
        _event = CameraRegistered(
            camera_id=dto.camera_id, company_device_id=dto.company_device_id
        )
        return dto

    async def update_camera(
        self,
        db: AsyncSession,
        camera_id: uuid.UUID,
        obj_in: CameraUpdate,
        actor: UserDTO,
    ) -> CameraDTO:
        camera = await self.camera_repo.get_by_id(db, camera_id)
        if not camera:
            raise CameraNotFoundException(camera_id)
        await self._require_company_device(db, camera.company_device_id, actor)
        updates = obj_in.model_dump(exclude_unset=True)
        if "camera_type" in updates and updates["camera_type"] not in CAMERA_TYPES:
            raise InvalidCameraTypeException(updates["camera_type"])
        updated = await self.camera_repo.update(db, camera, updates)
        return CameraDTO.model_validate(updated)

    async def update_status(
        self,
        db: AsyncSession,
        camera_id: uuid.UUID,
        obj_in: CameraStatusUpdate,
        actor: UserDTO,
    ) -> CameraDTO:
        if obj_in.camera_status not in CAMERA_STATUSES:
            raise InvalidCameraStatusException(obj_in.camera_status)
        camera = await self.camera_repo.get_by_id(db, camera_id)
        if not camera:
            raise CameraNotFoundException(camera_id)
        await self._require_company_device(db, camera.company_device_id, actor)
        old_status = camera.camera_status
        updated = await self.camera_repo.update(
            db, camera, {"camera_status": obj_in.camera_status}
        )
        dto = CameraDTO.model_validate(updated)
        _event = CameraStatusChanged(
            camera_id=camera_id,
            old_status=old_status,
            new_status=obj_in.camera_status,
        )
        return dto

    async def delete_camera(
        self, db: AsyncSession, camera_id: uuid.UUID, actor: UserDTO
    ) -> CameraDTO:
        camera = await self.camera_repo.get_by_id(db, camera_id)
        if not camera:
            raise CameraNotFoundException(camera_id)
        await self._require_company_device(db, camera.company_device_id, actor)
        deleted = await self.camera_repo.soft_delete(db, camera)
        dto = CameraDTO.model_validate(deleted)
        _event = CameraDeleted(camera_id=camera_id)
        return dto
