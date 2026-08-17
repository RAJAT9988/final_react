import uuid
from dataclasses import dataclass


@dataclass
class CameraRegistered:
    __event_name__ = "camera.registered"
    camera_id: uuid.UUID
    company_device_id: uuid.UUID


@dataclass
class CameraStatusChanged:
    __event_name__ = "camera.status_changed"
    camera_id: uuid.UUID
    old_status: str
    new_status: str


@dataclass
class CameraDeleted:
    __event_name__ = "camera.deleted"
    camera_id: uuid.UUID
