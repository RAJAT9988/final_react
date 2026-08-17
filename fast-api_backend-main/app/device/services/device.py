import uuid
from typing import List, Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.gateway import CompanyGateway
from app.device.constants import (
    APPROVAL_STATUS_PENDING,
    DEVICE_ROLE_SLAVE,
    DEVICE_ROLES,
    DEVICE_STATUS_INACTIVE,
    DEVICE_STATUSES,
)
from app.device.events import (
    DeviceDeleted,
    DeviceRegistered,
    DeviceStatusChanged,
    SlaveDeviceRegistrationRequested,
)
from app.device.exceptions import (
    DeviceAccessDeniedException,
    DeviceAlreadyExistsException,
    DeviceBranchNotFoundException,
    DeviceCompanyNotFoundException,
    DeviceNotFoundException,
    InvalidDeviceRoleException,
    InvalidDeviceStatusException,
)
from app.device.models.device import Device
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.schemas.company_device import CompanyDeviceDTO
from app.device.schemas.device import (
    DeviceCreate,
    DeviceDTO,
    DeviceUpdate,
    SlaveRegisterRequest,
    SlaveRegisterResponse,
)
from app.device.tenancy import ActorLike
from app.user_management.schemas.user import UserDTO

logger = structlog.get_logger(__name__)


class DeviceService:
    """Device CRUD and registration (device + pending company_device in one txn)."""

    def __init__(
        self,
        device_repo: DeviceRepository,
        company_device_repo: CompanyDeviceRepository,
        company_gateway: CompanyGateway,
    ) -> None:
        self.device_repo = device_repo
        self.company_device_repo = company_device_repo
        self.company_gateway = company_gateway

    async def _to_dto(
        self,
        db: AsyncSession,
        device: Device,
        assignment: Optional[CompanyDeviceDTO] = None,
    ) -> DeviceDTO:
        dto = DeviceDTO.model_validate(device)
        if assignment is not None:
            dto.current_assignment = assignment
            return dto
        current = await self.company_device_repo.get_current_by_device_id(
            db, device.device_id
        )
        if current:
            dto.current_assignment = CompanyDeviceDTO.model_validate(current)
        return dto

    def _ensure_visible(self, dto: DeviceDTO, actor: ActorLike) -> None:
        if dto.current_assignment is None:
            raise DeviceNotFoundException(dto.device_id)
        if dto.current_assignment.company_id is None:
            return
        if dto.current_assignment.company_id != actor.company_id:
            raise DeviceNotFoundException(dto.device_id)

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

    async def _require_actor_branch(
        self, db: AsyncSession, actor: ActorLike, branch_id: uuid.UUID
    ) -> None:
        await self._require_company_and_branch(db, actor.company_id, branch_id)

    async def get_by_id(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        actor: Optional[UserDTO] = None,
    ) -> DeviceDTO:
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        dto = await self._to_dto(db, device)
        if actor is not None:
            self._ensure_visible(dto, actor)
        return dto

    async def list_devices(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        actor: Optional[UserDTO] = None,
    ) -> List[DeviceDTO]:
        if actor is not None:
            return await self.list_devices_by_company(
                db, actor.company_id, skip=skip, limit=limit
            )
        devices = await self.device_repo.get_active_devices(db, skip=skip, limit=limit)
        return [await self._to_dto(db, device) for device in devices]

    async def list_devices_by_branch(
        self,
        db: AsyncSession,
        branch_id: uuid.UUID,
        pending_only: bool = False,
        actor: Optional[UserDTO] = None,
    ) -> List[DeviceDTO]:
        if actor is not None:
            await self._require_actor_branch(db, actor, branch_id)
        else:
            try:
                await self.company_gateway.get_branch(db, branch_id)
            except Exception as exc:
                raise DeviceBranchNotFoundException(branch_id) from exc
        rows = await self.company_device_repo.list_devices_by_branch(
            db, branch_id, pending_only=pending_only
        )
        return [
            await self._to_dto(
                db, device, assignment=CompanyDeviceDTO.model_validate(assignment)
            )
            for device, assignment in rows
        ]

    async def list_devices_by_company(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[DeviceDTO]:
        try:
            await self.company_gateway.get_company(db, company_id)
        except Exception as exc:
            raise DeviceCompanyNotFoundException(company_id) from exc
        rows = await self.company_device_repo.list_devices_by_company(db, company_id)
        dtos = [
            await self._to_dto(
                db, device, assignment=CompanyDeviceDTO.model_validate(assignment)
            )
            for device, assignment in rows
        ]
        return dtos[skip : skip + limit]

    async def create_device(
        self, db: AsyncSession, obj_in: DeviceCreate, actor: UserDTO
    ) -> DeviceDTO:
        await self._require_actor_branch(db, actor, obj_in.branch_id)
        existing_serial = await self.device_repo.get_by_serial_no(db, obj_in.serial_no)
        if existing_serial:
            raise DeviceAlreadyExistsException("serial_no", obj_in.serial_no)
        existing_mac = await self.device_repo.get_by_mac_id(db, obj_in.mac_id)
        if existing_mac:
            raise DeviceAlreadyExistsException("mac_id", obj_in.mac_id)

        device = await self.device_repo.create(
            db,
            {
                "device_name": obj_in.device_name,
                "ip": obj_in.ip,
                "serial_no": obj_in.serial_no,
                "mac_id": obj_in.mac_id,
                "manufacturing_date": obj_in.manufacturing_date,
                "dns_name": obj_in.dns_name,
                "device_role": DEVICE_ROLE_SLAVE,
                "status": DEVICE_STATUS_INACTIVE,
            },
        )
        assignment = await self.company_device_repo.create(
            db,
            {
                "device_id": device.device_id,
                "company_id": actor.company_id,
                "branch_id": obj_in.branch_id,
                "assign_by": actor.user_id,
                "approval_status": "pending_approval",
                "approved_by": None,
                "approved_at": None,
            },
        )
        _event = DeviceRegistered(
            device_id=device.device_id,
            company_id=actor.company_id,
            branch_id=obj_in.branch_id,
        )
        return await self._to_dto(
            db, device, assignment=CompanyDeviceDTO.model_validate(assignment)
        )

    async def register_slave(
        self,
        db: AsyncSession,
        obj_in: SlaveRegisterRequest,
        *,
        client_ip: Optional[str] = None,
    ) -> SlaveRegisterResponse:
        """Unauthenticated slave insert: Device + pending company_device, no master lookup."""
        existing_serial = await self.device_repo.get_by_serial_no(db, obj_in.serial_no)
        if existing_serial:
            logger.warning(
                "device.register_slave.rejected",
                reason="duplicate_serial_no",
                serial_no=obj_in.serial_no,
                client_ip=client_ip,
            )
            raise DeviceAlreadyExistsException("serial_no", obj_in.serial_no)
        existing_mac = await self.device_repo.get_by_mac_id(db, obj_in.mac_id)
        if existing_mac:
            logger.warning(
                "device.register_slave.rejected",
                reason="duplicate_mac_id",
                serial_no=obj_in.serial_no,
                client_ip=client_ip,
            )
            raise DeviceAlreadyExistsException("mac_id", obj_in.mac_id)

        device = await self.device_repo.create(
            db,
            {
                "device_name": obj_in.name,
                "ip": obj_in.ip,
                "dns_name": obj_in.dns_name,
                "serial_no": obj_in.serial_no,
                "mac_id": obj_in.mac_id,
                "device_role": DEVICE_ROLE_SLAVE,
                "status": DEVICE_STATUS_INACTIVE,
            },
        )
        assignment = await self.company_device_repo.create(
            db,
            {
                "device_id": device.device_id,
                "company_id": None,
                "branch_id": None,
                "assign_by": None,
                "approval_status": APPROVAL_STATUS_PENDING,
                "approved_by": None,
                "approved_at": None,
            },
        )
        _slave_requested = SlaveDeviceRegistrationRequested(
            device_id=device.device_id,
            company_device_id=assignment.company_device_id,
        )
        logger.info(
            "device.register_slave.accepted",
            device_id=str(device.device_id),
            serial_no=obj_in.serial_no,
            client_ip=client_ip,
        )
        return SlaveRegisterResponse(
            device_id=device.device_id,
            approval_status=assignment.approval_status,
        )

    async def update_device(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        obj_in: DeviceUpdate,
        actor: UserDTO,
    ) -> DeviceDTO:
        await self.get_by_id(db, device_id, actor=actor)
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        updates = obj_in.model_dump(exclude_unset=True)
        if "device_role" in updates:
            if actor.role_name != "owner":
                raise DeviceAccessDeniedException("set_device_role")
            role = updates["device_role"]
            if role not in DEVICE_ROLES:
                raise InvalidDeviceRoleException(role)
        if "status" in updates:
            new_status = updates["status"]
            if new_status not in DEVICE_STATUSES:
                raise InvalidDeviceStatusException(new_status)
            old_status = device.status
            updated = await self.device_repo.update(db, device, updates)
            if old_status != new_status:
                _event = DeviceStatusChanged(
                    device_id=device_id,
                    old_status=old_status,
                    new_status=new_status,
                )
            return await self._to_dto(db, updated)
        updated = await self.device_repo.update(db, device, updates)
        return await self._to_dto(db, updated)

    async def delete_device(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> DeviceDTO:
        await self.get_by_id(db, device_id, actor=actor)
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        current = await self.company_device_repo.get_current_by_device_id(db, device_id)
        if current:
            await self.company_device_repo.soft_delete(db, current)
        deleted = await self.device_repo.soft_delete(db, device)
        dto = await self._to_dto(db, deleted)
        _event = DeviceDeleted(device_id=device_id)
        return dto
