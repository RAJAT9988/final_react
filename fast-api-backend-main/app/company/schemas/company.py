from datetime import datetime
from typing import Literal
import uuid

from pydantic import BaseModel, ConfigDict, Field, EmailStr

from app.company.models.company import CompanyStatus
from app.core.db import FilterParam, ListParams, SortParam

class CompanyBase(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        from_attributes=True,
    )

    company_name: str | None = Field(default=None, min_length=3, max_length=64)
    contact_person_name: str | None = Field(default=None, min_length=3, max_length=64)
    contact_person_email: EmailStr | None = None
    contact_person_phone: str | None = Field(default=None, min_length=10, max_length=20)
    contact_person_designation: str | None = Field(default=None, min_length=2, max_length=64)
    company_description: str | None = Field(default=None, max_length=256)
    status_id: CompanyStatus | None = None

# Requests

class CompanyCreateRequest(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        from_attributes=True,
    )

    company_name: str = Field(min_length=3, max_length=64)
    contact_person_name: str = Field(min_length=3, max_length=64)
    contact_person_email: EmailStr
    contact_person_phone: str = Field(min_length=10, max_length=20)
    contact_person_designation: str
    company_description: str


class CompanyUpdateRequest(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
        from_attributes=True,
    )

    company_name: str | None = None
    contact_person_name: str | None = None
    contact_person_email: EmailStr | None = None
    contact_person_phone: str | None = None
    contact_person_designation: str | None = None
    company_description: str | None = None


class CompanySortParam(SortParam):
    field: Literal["id", "company_name", "status_id", "created_at"]


class CompanyFilterParam(FilterParam):
    field: Literal["id", "company_name", "status_id"]


class CompanyListParams(ListParams):
    sort: list[CompanySortParam] | None = None
    filters: list[CompanyFilterParam] | None = None


# Responses

class CompanyResponse(CompanyBase):
    id: uuid.UUID
    


# Repository DTOs

# class CompanyCreate(CompanyCreateRequest):
#     status_id: CompanyStatus | None = None

class CompanyCreateDTO(CompanyCreateRequest):
    status_id: CompanyStatus | None = None

class CompanyUpdateDTO(CompanyUpdateRequest):
    status_id: CompanyStatus | None = None

class CompanyDTO(CompanyBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    # created_by: int | None
    # updated_by: int | None
