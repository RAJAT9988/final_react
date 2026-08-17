import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DeviceHealthCreate(BaseModel):
    cpu_usage: float
    npu_usage: float
    ram: float
    temperature: float


class DeviceHealthDTO(DeviceHealthCreate):
    device_health_id: uuid.UUID
    company_device_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
