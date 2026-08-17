import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CompanyBase(BaseModel):
    company_name: str
    contact_person_designation: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_email: Optional[EmailStr] = None
    contact_person_mobile_no: Optional[str] = None
    company_description: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person_designation: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_email: Optional[EmailStr] = None
    contact_person_mobile_no: Optional[str] = None
    company_description: Optional[str] = None


class CompanyDTO(CompanyBase):
    company_id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
