import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DeviceModelSubscriptionCreate(BaseModel):
    model_id: str
    subscription_key: str
    is_enabled: bool = False
    enabled_by: Optional[uuid.UUID] = None
    start_date: date
    end_date: Optional[date] = None


class DeviceModelSubscriptionUpdate(BaseModel):
    model_id: Optional[str] = None
    subscription_key: Optional[str] = None
    is_enabled: Optional[bool] = None
    enabled_by: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class DeviceModelSubscriptionDTO(BaseModel):
    subscription_id: uuid.UUID
    company_device_id: uuid.UUID
    model_id: str
    is_enabled: bool
    enabled_by: Optional[uuid.UUID] = None
    start_date: date
    end_date: Optional[date] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
