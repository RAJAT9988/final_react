import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CameraBase(BaseModel):
    camera_name: str
    company_device_id: uuid.UUID
    camera_type: str
    rtsp_url: Optional[str] = None
    camera_status: str = "offline"
    location: Optional[str] = None
    zone: Optional[str] = None
    department: Optional[str] = None
    camera_group: Optional[str] = None
    resolution: Optional[str] = None
    fps_limit: Optional[int] = None


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    camera_name: Optional[str] = None
    camera_type: Optional[str] = None
    rtsp_url: Optional[str] = None
    location: Optional[str] = None
    zone: Optional[str] = None
    department: Optional[str] = None
    camera_group: Optional[str] = None
    resolution: Optional[str] = None
    fps_limit: Optional[int] = None


class CameraStatusUpdate(BaseModel):
    camera_status: str


class CameraDTO(CameraBase):
    camera_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
