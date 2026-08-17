import uuid
from dataclasses import dataclass


@dataclass
class DeviceRegistered:
    __event_name__ = "device.registered"
    device_id: uuid.UUID
    company_id: uuid.UUID
    branch_id: uuid.UUID


@dataclass
class SlaveDeviceRegistrationRequested:
    __event_name__ = "device.slave_registration_requested"
    device_id: uuid.UUID
    company_device_id: uuid.UUID


@dataclass
class DeviceApproved:
    __event_name__ = "device.approved"
    device_id: uuid.UUID
    company_device_id: uuid.UUID
    approved_by: uuid.UUID | None


@dataclass
class DeviceRejected:
    __event_name__ = "device.rejected"
    device_id: uuid.UUID
    company_device_id: uuid.UUID
    rejected_by: uuid.UUID | None


@dataclass
class DeviceReassigned:
    __event_name__ = "device.reassigned"
    device_id: uuid.UUID
    old_branch_id: uuid.UUID | None
    new_branch_id: uuid.UUID


@dataclass
class DeviceStatusChanged:
    __event_name__ = "device.status_changed"
    device_id: uuid.UUID
    old_status: str
    new_status: str


@dataclass
class DeviceHealthReported:
    __event_name__ = "device.health_reported"
    device_id: uuid.UUID
    company_device_id: uuid.UUID


@dataclass
class DeviceModelSubscriptionEnabled:
    __event_name__ = "device.model_subscription_enabled"
    subscription_id: uuid.UUID
    company_device_id: uuid.UUID
    model_id: str


@dataclass
class DeviceModelSubscriptionDisabled:
    __event_name__ = "device.model_subscription_disabled"
    subscription_id: uuid.UUID
    company_device_id: uuid.UUID
    model_id: str


@dataclass
class DeviceCameraAssigned:
    __event_name__ = "device.camera_assigned"
    model_assign_id: uuid.UUID
    camera_id: uuid.UUID
    company_device_id: uuid.UUID


@dataclass
class DeviceDeleted:
    __event_name__ = "device.deleted"
    device_id: uuid.UUID
