import uuid
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.device.schemas.company_device import CompanyDeviceDTO


class DeviceBase(BaseModel):
    device_name: str
    ip: str
    dns_name: Optional[str] = None
    device_role: str = "slave"
    status: str = "Inactive"
    serial_no: str
    mac_id: str
    manufacturing_date: Optional[date] = None


class DeviceCreate(BaseModel):
    device_name: str
    ip: str
    dns_name: Optional[str] = None
    serial_no: str
    mac_id: str
    manufacturing_date: Optional[date] = None
    branch_id: uuid.UUID


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    ip: Optional[str] = None
    dns_name: Optional[str] = None
    device_role: Optional[str] = None
    status: Optional[str] = None
    manufacturing_date: Optional[date] = None


class DeviceDTO(DeviceBase):
    device_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    current_assignment: Optional[CompanyDeviceDTO] = None

    model_config = ConfigDict(from_attributes=True)


class SlaveRegisterRequest(BaseModel):
    role: Literal["slave"]
    name: str
    ip: str
    dns_name: Optional[str] = None
    mac_id: str
    serial_no: str


class SlaveRegisterResponse(BaseModel):
    device_id: uuid.UUID
    approval_status: str = Field(description="Always pending_approval on create.")
