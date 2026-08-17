import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DeviceCameraAssignmentCreate(BaseModel):
    camera_id: uuid.UUID
    confidence_threshold: float
    status: str = "stopped"
    start_date: date
    end_date: Optional[date] = None


class DeviceCameraAssignmentUpdate(BaseModel):
    confidence_threshold: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class DeviceCameraAssignmentDTO(BaseModel):
    model_assign_id: uuid.UUID
    camera_id: uuid.UUID
    company_device_id: uuid.UUID
    confidence_threshold: float
    status: str
    start_date: date
    end_date: Optional[date] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
