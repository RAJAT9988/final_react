import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CompanyBranchBase(BaseModel):
    branch_name: str
    company_id: uuid.UUID
    # address_id: Optional[uuid.UUID] = None
    branch_contact_person_designation: Optional[str] = None
    branch_contact_person_name: Optional[str] = None
    branch_contact_person_email: Optional[EmailStr] = None
    branch_contact_person_mobile_no: Optional[str] = None


class CompanyBranchCreate(CompanyBranchBase):
    pass


class CompanyBranchUpdate(BaseModel):
    branch_name: Optional[str] = None
    company_id: Optional[uuid.UUID] = None
    # address_id: Optional[uuid.UUID] = None
    branch_contact_person_designation: Optional[str] = None
    branch_contact_person_name: Optional[str] = None
    branch_contact_person_email: Optional[EmailStr] = None
    branch_contact_person_mobile_no: Optional[str] = None


class CompanyBranchDTO(CompanyBranchBase):
    branch_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
