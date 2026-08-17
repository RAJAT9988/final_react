import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompanyDeviceBase(BaseModel):
    device_id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    branch_id: Optional[uuid.UUID] = None
    assign_by: Optional[uuid.UUID] = None
    approval_status: str = "pending_approval"
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None


class CompanyDeviceDTO(CompanyDeviceBase):
    company_device_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeviceReassign(BaseModel):
    branch_id: uuid.UUID


class DeviceApprovalAction(BaseModel):
    approved_by: Optional[uuid.UUID] = None
