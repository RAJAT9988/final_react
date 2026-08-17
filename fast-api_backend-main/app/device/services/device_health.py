import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.device.events import DeviceHealthReported
from app.device.exceptions import (
    CompanyDeviceNotFoundException,
    DeviceHealthNotFoundException,
    DeviceNotFoundException,
)
from app.device.models.company_device import CompanyDevice
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_health import DeviceHealthRepository
from app.device.schemas.device_health import DeviceHealthCreate, DeviceHealthDTO
from app.device.tenancy import ensure_assignment_company
from app.user_management.schemas.user import UserDTO


class DeviceHealthService:
    """Synchronous health ingest and latest snapshot reads."""

    def __init__(
        self,
        health_repo: DeviceHealthRepository,
        company_device_repo: CompanyDeviceRepository,
        device_repo: DeviceRepository,
    ) -> None:
        self.health_repo = health_repo
        self.company_device_repo = company_device_repo
        self.device_repo = device_repo

    async def _current_assignment(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> CompanyDevice:
        device = await self.device_repo.get_by_id(db, device_id)
        if not device:
            raise DeviceNotFoundException(device_id)
        assignment = await self.company_device_repo.get_current_by_device_id(
            db, device_id
        )
        if not assignment:
            raise CompanyDeviceNotFoundException(device_id)
        ensure_assignment_company(assignment, actor.company_id, as_device_id=device_id)
        return assignment

    async def ingest(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        obj_in: DeviceHealthCreate,
        actor: UserDTO,
    ) -> DeviceHealthDTO:
        assignment = await self._current_assignment(db, device_id, actor)
        snapshot = await self.health_repo.create(
            db,
            {
                "company_device_id": assignment.company_device_id,
                **obj_in.model_dump(),
            },
        )
        _event = DeviceHealthReported(
            device_id=device_id,
            company_device_id=assignment.company_device_id,
        )
        return DeviceHealthDTO.model_validate(snapshot)

    async def get_latest(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> DeviceHealthDTO:
        assignment = await self._current_assignment(db, device_id, actor)
        snapshot = await self.health_repo.get_latest_by_company_device_id(
            db, assignment.company_device_id
        )
        if not snapshot:
            raise DeviceHealthNotFoundException(device_id)
        return DeviceHealthDTO.model_validate(snapshot)
