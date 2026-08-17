import uuid
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.device.constants import (
    APPROVAL_STATUS_APPROVED,
    MODEL_IDS,
)
from app.device.events import (
    DeviceModelSubscriptionDisabled,
    DeviceModelSubscriptionEnabled,
)
from app.device.exceptions import (
    CompanyDeviceNotFoundException,
    DeviceModelSubscriptionNotFoundException,
    DeviceNotApprovedException,
    DeviceNotFoundException,
    InvalidModelIdException,
)
from app.device.models.company_device import CompanyDevice
from app.device.repositories.company_device import CompanyDeviceRepository
from app.device.repositories.device import DeviceRepository
from app.device.repositories.device_model_subscription import (
    DeviceModelSubscriptionRepository,
)
from app.device.schemas.device_model_subscription import (
    DeviceModelSubscriptionCreate,
    DeviceModelSubscriptionDTO,
    DeviceModelSubscriptionUpdate,
)
from app.device.tenancy import ensure_assignment_company
from app.user_management.schemas.user import UserDTO


class DeviceModelSubscriptionService:
    """Model subscriptions with a service-layer approval gate on enable."""

    def __init__(
        self,
        subscription_repo: DeviceModelSubscriptionRepository,
        company_device_repo: CompanyDeviceRepository,
        device_repo: DeviceRepository,
    ) -> None:
        self.subscription_repo = subscription_repo
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
        assignment = await self.company_device_repo.get_current_by_device_id(
            db, device_id
        )
        if not assignment:
            raise CompanyDeviceNotFoundException(device_id)
        ensure_assignment_company(assignment, actor.company_id, as_device_id=device_id)
        return assignment

    async def list_by_device(
        self, db: AsyncSession, device_id: uuid.UUID, actor: UserDTO
    ) -> List[DeviceModelSubscriptionDTO]:
        assignment = await self._current_assignment(db, device_id, actor)
        rows = await self.subscription_repo.list_by_company_device_id(
            db, assignment.company_device_id
        )
        return [DeviceModelSubscriptionDTO.model_validate(row) for row in rows]

    async def create_subscription(
        self,
        db: AsyncSession,
        device_id: uuid.UUID,
        obj_in: DeviceModelSubscriptionCreate,
        actor: UserDTO,
    ) -> DeviceModelSubscriptionDTO:
        if obj_in.model_id not in MODEL_IDS:
            raise InvalidModelIdException(obj_in.model_id)
        assignment = await self._current_assignment(db, device_id, actor)
        if obj_in.is_enabled:
            self._ensure_approved(assignment)
        payload = obj_in.model_dump()
        payload["company_device_id"] = assignment.company_device_id
        if payload.get("enabled_by") is None and obj_in.is_enabled:
            payload["enabled_by"] = actor.user_id
        created = await self.subscription_repo.create(db, payload)
        dto = DeviceModelSubscriptionDTO.model_validate(created)
        if created.is_enabled:
            _event = DeviceModelSubscriptionEnabled(
                subscription_id=created.subscription_id,
                company_device_id=assignment.company_device_id,
                model_id=created.model_id,
            )
        return dto

    async def update_subscription(
        self,
        db: AsyncSession,
        subscription_id: uuid.UUID,
        obj_in: DeviceModelSubscriptionUpdate,
        actor: UserDTO,
    ) -> DeviceModelSubscriptionDTO:
        subscription = await self.subscription_repo.get_by_id(db, subscription_id)
        if not subscription:
            raise DeviceModelSubscriptionNotFoundException(subscription_id)
        assignment = await self.company_device_repo.get_by_id(
            db, subscription.company_device_id
        )
        if not assignment:
            raise CompanyDeviceNotFoundException(subscription.company_device_id)
        ensure_assignment_company(assignment, actor.company_id)
        updates = obj_in.model_dump(exclude_unset=True)
        if "model_id" in updates and updates["model_id"] not in MODEL_IDS:
            raise InvalidModelIdException(updates["model_id"])
        enabling = bool(updates.get("is_enabled"))
        if enabling:
            self._ensure_approved(assignment)
            if updates.get("enabled_by") is None:
                updates["enabled_by"] = actor.user_id
        was_enabled = subscription.is_enabled
        updated = await self.subscription_repo.update(db, subscription, updates)
        dto = DeviceModelSubscriptionDTO.model_validate(updated)
        if updated.is_enabled and not was_enabled:
            _enabled_event = DeviceModelSubscriptionEnabled(
                subscription_id=updated.subscription_id,
                company_device_id=updated.company_device_id,
                model_id=updated.model_id,
            )
        elif was_enabled and not updated.is_enabled:
            _disabled_event = DeviceModelSubscriptionDisabled(
                subscription_id=updated.subscription_id,
                company_device_id=updated.company_device_id,
                model_id=updated.model_id,
            )
        return dto
