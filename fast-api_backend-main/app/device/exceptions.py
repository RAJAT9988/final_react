import uuid
from typing import Optional

from app.device.constants import MASTER_UNAVAILABLE_MESSAGE


class DeviceModuleException(Exception):
    """Base exception for all device module domain errors."""

    status_code: int = 400

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class DeviceNotFoundException(DeviceModuleException):
    """Raised when a requested device is not found."""

    status_code = 404

    def __init__(self, device_id: uuid.UUID) -> None:
        self.device_id = device_id
        super().__init__(f"Device with ID {device_id} not found.")


class CompanyDeviceNotFoundException(DeviceModuleException):
    """Raised when a requested company_device assignment is not found."""

    status_code = 404

    def __init__(self, identifier: uuid.UUID) -> None:
        self.identifier = identifier
        super().__init__(f"Company device assignment {identifier} not found.")


class DeviceHealthNotFoundException(DeviceModuleException):
    """Raised when no health snapshot exists for the device assignment."""

    status_code = 404

    def __init__(self, device_id: uuid.UUID) -> None:
        self.device_id = device_id
        super().__init__(f"No health snapshot found for device {device_id}.")


class DeviceModelSubscriptionNotFoundException(DeviceModuleException):
    """Raised when a model subscription is not found."""

    status_code = 404

    def __init__(self, subscription_id: uuid.UUID) -> None:
        self.subscription_id = subscription_id
        super().__init__(f"Model subscription {subscription_id} not found.")


class DeviceCameraAssignmentNotFoundException(DeviceModuleException):
    """Raised when a camera assignment is not found."""

    status_code = 404

    def __init__(self, model_assign_id: uuid.UUID) -> None:
        self.model_assign_id = model_assign_id
        super().__init__(f"Camera assignment {model_assign_id} not found.")


class DeviceMasterUnavailableException(DeviceModuleException):
    """Generic rejection when the target master cannot be used (no leak of why)."""

    status_code = 404

    def __init__(self) -> None:
        super().__init__(MASTER_UNAVAILABLE_MESSAGE)


class DeviceAlreadyExistsException(DeviceModuleException):
    """Raised when serial_no or mac_id is already registered."""

    status_code = 409

    def __init__(self, field: str, value: str) -> None:
        self.field = field
        self.value = value
        super().__init__(f"A device with {field} '{value}' already exists.")


class DeviceCompanyNotFoundException(DeviceModuleException):
    """Raised when the referenced company does not exist."""

    status_code = 404

    def __init__(self, company_id: uuid.UUID) -> None:
        self.company_id = company_id
        super().__init__(f"Company with ID {company_id} not found.")


class DeviceBranchNotFoundException(DeviceModuleException):
    """Raised when the referenced branch does not exist or is not in the company."""

    status_code = 404

    def __init__(self, branch_id: uuid.UUID) -> None:
        self.branch_id = branch_id
        super().__init__(f"Company branch with ID {branch_id} not found.")


class DeviceNotApprovedException(DeviceModuleException):
    """Raised when an unapproved device attempts a gated action."""

    status_code = 403

    def __init__(self, company_device_id: uuid.UUID) -> None:
        self.company_device_id = company_device_id
        super().__init__(
            f"Company device {company_device_id} is not approved for this action."
        )


class DeviceEnrollmentNotPendingException(DeviceModuleException):
    """Raised when approve/reject is called on a non-pending assignment."""

    status_code = 409

    def __init__(
        self, device_id: uuid.UUID, current_status: Optional[str] = None
    ) -> None:
        self.device_id = device_id
        self.current_status = current_status
        detail = f"Device {device_id} is not pending approval."
        if current_status:
            detail = (
                f"Device {device_id} is not pending approval (status={current_status})."
            )
        super().__init__(detail)


class InvalidDeviceRoleException(DeviceModuleException):
    """Raised when device_role is not a supported value."""

    status_code = 400

    def __init__(self, device_role: str) -> None:
        self.device_role = device_role
        super().__init__(f"Invalid device role: {device_role}.")


class InvalidDeviceStatusException(DeviceModuleException):
    """Raised when Device.status is not a supported value."""

    status_code = 400

    def __init__(self, status: str) -> None:
        self.device_status = status
        super().__init__(f"Invalid device status: {status}.")


class InvalidModelIdException(DeviceModuleException):
    """Raised when model_id is not a supported detection category."""

    status_code = 400

    def __init__(self, model_id: str) -> None:
        self.model_id = model_id
        super().__init__(f"Invalid model_id: {model_id}.")


class InvalidAssignmentStatusException(DeviceModuleException):
    """Raised when assignment status is not running/stopped/paused."""

    status_code = 400

    def __init__(self, status: str) -> None:
        self.assignment_status = status
        super().__init__(f"Invalid camera assignment status: {status}.")


class DeviceAccessDeniedException(DeviceModuleException):
    """Raised when the caller lacks a device action (e.g. set role)."""

    status_code = 403

    def __init__(self, permission_name: str) -> None:
        self.permission_name = permission_name
        super().__init__(f"Permission denied: {permission_name}.")


class DeviceCameraNotFoundException(DeviceModuleException):
    """Raised when CameraGateway cannot resolve a camera_id."""

    status_code = 404

    def __init__(self, camera_id: uuid.UUID) -> None:
        self.camera_id = camera_id
        super().__init__(f"Camera with ID {camera_id} not found.")
