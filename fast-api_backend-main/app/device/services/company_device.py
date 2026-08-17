import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.company.gateway import CompanyGateway
from app.device.constants import (
    APPROVAL_STATUS_APPROVED,
    APPROVAL_STATUS_PENDING,
    APPROVAL_STATUS_REJECTED,
    DEVICE_STATUS_ACTIVE,
    DEVICE_STATUS_INACTIVE,
)
from app.device.events import DeviceApproved, DeviceReassigned, DeviceRejected
from app.device.exceptions import (
    CompanyDeviceNotFoundException,
    DeviceBranchNotFoundException,
    DeviceCompanyNotFoundException,
    DeviceEnrollmentNotPendingException,
    DeviceNotFoundException,
)
from app.device.models.company_device import CompanyDevice
from app.device.models.device import Device
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.schemas.company_device import CompanyDeviceDTO, DeviceReassign
from app.device.schemas.device import DeviceDTO
from app.device.tenancy import ensure_assignment_company
from app.user_management.schemas.user import UserDTO


class CompanyDeviceService:
    """Enrollment approval, rejection, and reassignment."""

    def __init__(
        self,
        company_device_repo: CompanyDeviceRepository,
        device_repo: DeviceRepository,
        company_gateway: CompanyGateway,
    ) -> None:
        self.company_device_repo = company_device_repo
        self.device_repo = device_repo
        self.company_gateway = company_gateway

    def _to_device_dto(self, device: Device, assignment: CompanyDeviceDTO) -> DeviceDTO:
        dto = DeviceDTO.model_validate(device)
        dto.current_assignment = assignment
        return dto

    async def _require_company_and_branch(
        self, db: AsyncSession, company_id: uuid.UUID, branch_id: uuid.UUID
    ) -> None:
        try:
            await self.company_gateway.get_company(db, company_id)
        except Exception as exc:
            raise DeviceCompanyNotFoundException(company_id) from exc
        try:
            branch = await self.company_gateway.get_branch(db, branch_id)
        except Exception as exc:
            raise DeviceBranchNotFoundException(branch_id) from exc
        if branch.company_id != company_id:
            raise DeviceBranchNotFoundException(branch_id)

    async def get_by_id(
        self, db: AsyncSession, company_device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        assignment = await self.company_device_repo.get_by_id(db, company_device_id)
        if not assignment:
            raise CompanyDeviceNotFoundException(company_device_id)
        return CompanyDeviceDTO.model_validate(assignment)

    async def get_current_by_device_id(
        self, db: AsyncSession, device_id: uuid.UUID
    ) -> CompanyDeviceDTO:
        assignment = await self.company_device_repo.get_current_by_device_id(
            db, device_id
        )
        if not assignment:
            raise CompanyDeviceNotFoundException(device_id)
        return CompanyDeviceDTO.model_validate(assignment)

    async def list_by_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> List[CompanyDeviceDTO]:
        rows = await self.company_device_repo.list_by_branch_id(db, branch_id)
        return [CompanyDeviceDTO.model_validate(row) for row in rows]

    async def _require_pending_current(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
    ) -> Tuple[Device, CompanyDevice]:
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        assignment = await self.company_device_repo.get_current_by_device_id(
            db, device_id
        )
        if not assignment:
            raise CompanyDeviceNotFoundException(device_id)
        if actor is not None:
            ensure_assignment_company(
                assignment, actor.company_id, as_device_id=device_id
            )
        if assignment.approval_status != APPROVAL_STATUS_PENDING:
            raise DeviceEnrollmentNotPendingException(
                device_id, assignment.approval_status
            )
        return device, assignment

    async def approve(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
        approved_by: uuid.UUID | None = None,
    ) -> DeviceDTO:
        device, assignment = await self._require_pending_current(
            db, device_id, actor=actor
        )
        actor_id = actor.user_id if actor is not None else approved_by
        now = datetime.now(timezone.utc)
        assignment_updates: dict[str, object] = {
            "approval_status": APPROVAL_STATUS_APPROVED,
            "approved_by": actor_id,
            "approved_at": now,
        }
        if assignment.company_id is None and actor is not None:
            assignment_updates["company_id"] = actor.company_id
        updated = await self.company_device_repo.update(
            db,
            assignment,
            assignment_updates,
        )
        await self.device_repo.update(db, device, {"status": DEVICE_STATUS_ACTIVE})
        assignment_dto = CompanyDeviceDTO.model_validate(updated)
        _event = DeviceApproved(
            device_id=device_id,
            company_device_id=updated.company_device_id,
            approved_by=actor_id,
        )
        refreshed = await self.device_repo.get_by_id(db, device_id)
        if refreshed is None:
            raise DeviceNotFoundException(device_id)
        return self._to_device_dto(refreshed, assignment_dto)

    async def reject(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
        rejected_by: uuid.UUID | None = None,
    ) -> DeviceDTO:
        device, assignment = await self._require_pending_current(
            db, device_id, actor=actor
        )
        actor_id = actor.user_id if actor is not None else rejected_by
        updated = await self.company_device_repo.update(
            db,
            assignment,
            {"approval_status": APPROVAL_STATUS_REJECTED},
        )
        assignment_dto = CompanyDeviceDTO.model_validate(updated)
        _event = DeviceRejected(
            device_id=device_id,
            company_device_id=updated.company_device_id,
            rejected_by=actor_id,
        )
        return self._to_device_dto(device, assignment_dto)

    async def reassign(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        obj_in: DeviceReassign,
        actor: UserDTO,
    ) -> DeviceDTO:
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        current = await self.company_device_repo.get_current_by_device_id(db, device_id)
        if not current:
            raise CompanyDeviceNotFoundException(device_id)
        ensure_assignment_company(current, actor.company_id, as_device_id=device_id)
        await self._require_company_and_branch(db, actor.company_id, obj_in.branch_id)
        old_branch_id = current.branch_id
        await self.company_device_repo.soft_delete(db, current)
        new_assignment = await self.company_device_repo.create(
            db,
            {
                "device_id": device_id,
                "company_id": actor.company_id,
                "branch_id": obj_in.branch_id,
                "assign_by": actor.user_id,
                "approval_status": APPROVAL_STATUS_PENDING,
                "approved_by": None,
                "approved_at": None,
            },
        )
        updated_device = await self.device_repo.update(
            db, device, {"status": DEVICE_STATUS_INACTIVE}
        )
        _event = DeviceReassigned(
            device_id=device_id,
            old_branch_id=old_branch_id,
            new_branch_id=obj_in.branch_id,
        )
        return self._to_device_dto(
            updated_device, CompanyDeviceDTO.model_validate(new_assignment)
        )
