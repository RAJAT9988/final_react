
from typing_extensions import Literal
from datetime import datetime
import uuid

from app.core.db import FilterParam, ListParams, SortParam

from pydantic import BaseModel, ConfigDict, EmailStr, Field

class CompanyBranchBase(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        from_attributes=True,
    )
    company_id: uuid.UUID

    branch_name: str | None = Field(default=None, min_length=3, max_length=64)
    branch_contact_person_name: str | None = Field(default=None, min_length=3, max_length=64)
    branch_contact_person_email: EmailStr | None = None
    branch_contact_person_phone: str | None = Field(default=None, min_length=10, max_length=20)
    branch_contact_person_designation: str | None = Field(default=None, min_length=2, max_length=64)

#Requests
class CompanyBranchCreateRequest(CompanyBranchBase):
    company_id: uuid.UUID
    branch_name: str = Field(min_length=3, max_length=64)
    branch_contact_person_name: str = Field(min_length=3, max_length=64)
    branch_contact_person_email: EmailStr
    branch_contact_person_phone: str = Field(min_length=10, max_length=20)
    branch_contact_person_designation: str

class CompanyBranchUpdateRequest(CompanyBranchBase):
    branch_name: str | None = None
    branch_contact_person_name: str | None = None
    branch_contact_person_email: EmailStr | None = None
    branch_contact_person_phone: str | None = None
    branch_contact_person_designation: str | None = None

class CompanyBranchSortParam(SortParam):
    field: Literal["id", "branch_name", "created_at"]

class CompanyBranchFilterParam(FilterParam):
    field: Literal["id", "branch_name", "company_id"]

class CompanyBranchListParams(ListParams):
    sort: CompanyBranchSortParam | None = None
    filter: CompanyBranchFilterParam | None = None


# Responses

class CompanyBranchResponse(CompanyBranchBase):
    id: uuid.UUID
    # company_id: int
    # branch_name: str



# Repository DTOs

class CompanyBranchCreateDTO(CompanyBranchCreateRequest):
    company_id: uuid.UUID
    created_by: int | None = None

class CompanyBranchUpdateDTO(CompanyBranchUpdateRequest):
    updated_by: int | None = None

class CompanyBranchDTO(CompanyBranchBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime