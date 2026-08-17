import uuid
from typing import Any, List, Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.device.constants import (
    APPROVAL_STATUS_APPROVED,
    ASSIGNMENT_STATUS_RUNNING,
    ASSIGNMENT_STATUSES,
)
from app.device.events import DeviceCameraAssigned
from app.device.exceptions import (
    CompanyDeviceNotFoundException,
    DeviceCameraAssignmentNotFoundException,
    DeviceCameraNotFoundException,
    DeviceNotApprovedException,
    DeviceNotFoundException,
    InvalidAssignmentStatusException,
)
from app.device.models.company_device import CompanyDevice
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_camera_assignment import (
    DeviceCameraAssignmentRepository,
)
from app.device.schemas.device_camera_assignment import (
    DeviceCameraAssignmentCreate,
    DeviceCameraAssignmentDTO,
    DeviceCameraAssignmentUpdate,
)
from app.device.tenancy import ensure_assignment_company
from app.user_management.schemas.user import UserDTO


class CameraLookup(Protocol):
    """Minimal CameraGateway surface used when creating assignments."""

    async def get_camera(self, db: AsyncSession, camera_id: uuid.UUID) -> Any: ...


class DeviceCameraAssignmentService:
    """Camera assignments with a service-layer approval gate."""

    def __init__(
        self,
        assignment_repo: DeviceCameraAssignmentRepository,
        company_device_repo: CompanyDeviceRepository,
        device_repo: DeviceRepository,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.company_device_repo = company_device_repo
        self.device_repo = device_repo

    def _ensure_approved(self, assignment: CompanyDevice) -> None:
        if assignment.approval_status != APPROVAL_STATUS_APPROVED:
            raise DeviceNotApprovedException(assignment.company_device_id)

    async def _current_assignment(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> CompanyDevice:
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        current = await self.company_device_repo.get_current_by_device_id(db, device_id)
        if not current:
            raise CompanyDeviceNotFoundException(device_id)
        ensure_assignment_company(current, actor.company_id, as_device_id=device_id)
        return current

    async def list_by_device(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> List[DeviceCameraAssignmentDTO]:
        current = await self._current_assignment(db, device_id, actor)
        rows = await self.assignment_repo.list_by_company_device_id(
            db, current.company_device_id
        )
        return [DeviceCameraAssignmentDTO.model_validate(row) for row in rows]

    async def create_assignment(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        obj_in: DeviceCameraAssignmentCreate,
        camera_gateway: CameraLookup,
        actor: UserDTO,
    ) -> DeviceCameraAssignmentDTO:
        if obj_in.status not in ASSIGNMENT_STATUSES:
            raise InvalidAssignmentStatusException(obj_in.status)
        current = await self._current_assignment(db, device_id, actor)
        self._ensure_approved(current)
        try:
            camera = await camera_gateway.get_camera(db, obj_in.camera_id)
        except Exception as exc:
            raise DeviceCameraNotFoundException(obj_in.camera_id) from exc
        camera_company_device_id = getattr(camera, "company_device_id", None)
        if camera_company_device_id is not None:
            camera_assignment = await self.company_device_repo.get_by_id(
                db, camera_company_device_id
            )
            if camera_assignment is None:
                raise DeviceCameraNotFoundException(obj_in.camera_id)
            ensure_assignment_company(camera_assignment, actor.company_id)
        created = await self.assignment_repo.create(
            db,
            {
                "camera_id": obj_in.camera_id,
                "company_device_id": current.company_device_id,
                "confidence_threshold": obj_in.confidence_threshold,
                "status": obj_in.status,
                "start_date": obj_in.start_date,
                "end_date": obj_in.end_date,
            },
        )
        _event = DeviceCameraAssigned(
            model_assign_id=created.model_assign_id,
            camera_id=created.camera_id,
            company_device_id=current.company_device_id,
        )
        return DeviceCameraAssignmentDTO.model_validate(created)

    async def update_assignment(
        self,
        db: AsyncSession,
        model_assign_id: uuid.UUID,
        obj_in: DeviceCameraAssignmentUpdate,
        actor: UserDTO,
    ) -> DeviceCameraAssignmentDTO:
        assignment = await self.assignment_repo.get_by_id(db, model_assign_id)
        if not assignment:
            raise DeviceCameraAssignmentNotFoundException(model_assign_id)
        current = await self.company_device_repo.get_by_id(
            db, assignment.company_device_id
        )
        if not current:
            raise CompanyDeviceNotFoundException(assignment.company_device_id)
        ensure_assignment_company(current, actor.company_id)
        updates = obj_in.model_dump(exclude_unset=True)
        if "status" in updates:
            if updates["status"] not in ASSIGNMENT_STATUSES:
                raise InvalidAssignmentStatusException(updates["status"])
            if updates["status"] == ASSIGNMENT_STATUS_RUNNING:
                self._ensure_approved(current)
        updated = await self.assignment_repo.update(db, assignment, updates)
        return DeviceCameraAssignmentDTO.model_validate(updated)

    async def delete_assignment(
        self, db: AsyncSession, model_assign_id: uuid.UUID, actor: UserDTO
    ) -> DeviceCameraAssignmentDTO:
        assignment = await self.assignment_repo.get_by_id(db, model_assign_id)
        if not assignment:
            raise DeviceCameraAssignmentNotFoundException(model_assign_id)
        current = await self.company_device_repo.get_by_id(
            db, assignment.company_device_id
        )
        if not current:
            raise CompanyDeviceNotFoundException(assignment.company_device_id)
        ensure_assignment_company(current, actor.company_id)
        deleted = await self.assignment_repo.soft_delete(db, assignment)
        return DeviceCameraAssignmentDTO.model_validate(deleted)
