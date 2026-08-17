import uuid
from typing import Optional, Protocol

from app.device.exceptions import (
    CompanyDeviceNotFoundException,
    DeviceNotFoundException,
)
from app.device.models.company_device import CompanyDevice
from app.device.schemas.company_device import CompanyDeviceDTO


class ActorLike(Protocol):
    user_id: uuid.UUID
    company_id: uuid.UUID
    role_name: Optional[str]


def ensure_assignment_company(
    assignment: CompanyDevice | CompanyDeviceDTO,
    actor_company_id: uuid.UUID,
    *,
    as_device_id: Optional[uuid.UUID] = None,
) -> None:
    """Hide other tenants as not-found rather than 403."""
    if assignment.company_id is None:
        return
    if assignment.company_id != actor_company_id:
        if as_device_id is not None:
            raise DeviceNotFoundException(as_device_id)
        raise CompanyDeviceNotFoundException(assignment.company_device_id)
