from pydantic import BaseModel, ConfigDict, Field
from app.core.db import FilterParam, ListParams, SortParam
from typing_extensions import Literal
from uuid import UUID


class AddressBase(BaseModel):
    model_config = ConfigDict(
        use_enum_values = True,
        from_attributes = True,
    )
    country_id: int
    state_id: int
    # city_id: int
    city: str
    
    area: str
    landmark: str | None = None
    postal_code: str
    
    lattitude: str | None = None
    longitude: str | None = None

# Requests
class AddressCreateRequest(BaseModel):
    country_id: int
    state_id: int
    # city_id: int
    city: str

    area: str
    landmark: str | None = None
    postal_code: str

    lattitude: str | None = None
    longitude: str | None = None

class AddressUpdateRequest(BaseModel):
    country_id: int | None = None
    state_id: int | None = None
    city: str

    area: str | None = None
    landmark: str | None = None
    postal_code: str | None = None

    lattitude: str | None = None
    longitude: str | None = None   



class CompanyAddressSortParam(SortParam):
    field: Literal["id", "country_id", "created_at"]

class CompanyAddressFilterParam(FilterParam):
    field: Literal["id", "branch_name", "company_id"]

class CompanyAddressListParams(ListParams):
    sort: CompanyAddressSortParam | None = None
    filter: CompanyAddressFilterParam | None = None


# Responses
class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id : UUID
    # company_id: int
    # branch_id: int



class CountryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    country_name: str

class StateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    state_name: str
    country_id: int

# DTO
class AddressCreateDTO(AddressCreateRequest):
    company_branch_id: UUID
    created_by: int | None = None

class AddressUpdateDTO(AddressUpdateRequest):
    updated_by: int | None = None

class AddressCreateDTO(AddressBase):
    company_branch_id:UUID
    created_by: int | None = None


class CountryBase(BaseModel):
    model_config = ConfigDict(
            use_enum_values = True,
            from_attributes = True,
        )
    country_name: str | None = None

class CountrySortParams(SortParam):
    field: Literal["id", "created_at"]

class CountryFilterParams(FilterParam):
    field: Literal["id", "country_name"]
    
class CountryListParams(ListParams):
    sort: CountrySortParams | None = None
    filter : CountryFilterParams | None = None

class CountryCreateDTO(CountryBase):
    created_at: int | None = None

class CountryUpdateRequest(BaseModel):
    country_name: str

class StateBase(BaseModel):
    model_config = ConfigDict(
                use_enum_values = True,
                from_attributes = True,
            )
    state_name: str | None = None
    country_id : int


