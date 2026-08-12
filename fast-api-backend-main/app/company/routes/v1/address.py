from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
import uuid
from app.company.schemas.address import (
    AddressUpdateRequest,
    AddressCreateDTO,
    AddressCreateRequest,
    AddressResponse,
    CompanyAddressFilterParam,
    CompanyAddressSortParam,
    CompanyAddressListParams,
    CountryResponse,
    StateResponse,
    CountrySortParams,
    CountryFilterParams,
    CountryListParams,
    AddressUpdateDTO
)

from sqlalchemy import select
from app.company.models.address import Country, State
from app.core.api import Response
from app.core.db import get_session

from app.company.services.address import CountryService
from app.company.dependencies.services import CompanyAddressServiceDep, CountryServiceDep

from app.core.api import (
    ConfigurableRateLimiter,
    ListParamsBuilder,
    PaginatedResponse,
    Response,
    ResponseMeta
)

router = APIRouter(
    dependencies = [
        Depends(ConfigurableRateLimiter(times=50, seconds=60))
    ]
)
list_params_builder = ListParamsBuilder(CompanyAddressListParams, CompanyAddressSortParam, CompanyAddressFilterParam)

@router.post("/branches/{branch_id}/addresses")
async def register_address_for_branch(branch_id: uuid.UUID, request: AddressCreateRequest, address_service: CompanyAddressServiceDep) -> Response[AddressResponse]:
    dto = AddressCreateDTO(
        **request.model_dump(exclude_none=True, exclude_unset=True),
        company_branch_id=branch_id,
    )
    address = await address_service.register_address(dto)
    return Response(data=address)
    # return Response(data=AddressResponse.model_validate(address).model_dump())

# @router.get("/address")
# async def get_address_list(address_service: CompanyAddressServiceDep, request: CompanyAddressListParams = Depends(list_params_builder)) -> Response[AddressResponse]:
#     addresses = await address_service.get_list(request, AddressResponse)
#     address_items = [AddressResponse.model_validate(address) for address in addresses.items]

#     return PaginatedResponse(data=address_items, meta=ResponseMeta(pagination=addresses.pagination))

@router.get("/address")
async def get_address_list(
    address_service: CompanyAddressServiceDep,
    request: CompanyAddressListParams = Depends(list_params_builder),
) -> PaginatedResponse[list[AddressResponse]]:
    addresses = await address_service.get_list(request, AddressResponse)
    address_items = [
        AddressResponse.model_validate(address).model_dump()
        for address in addresses.items
    ]

    return PaginatedResponse(
        data=address_items,
        meta=ResponseMeta(pagination=addresses.pagination).model_dump(),
    )

@router.patch("/{address_id}")
async def update_address(address_id: uuid.UUID,
                         request: AddressUpdateRequest,
                         address_service: CompanyAddressServiceDep) -> Response[AddressResponse]:
    address = await address_service.update(address_id=address_id, address_data=AddressUpdateDTO(**request.model_dump(exclude_none=True, exclude_unset=True)))

    if address is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company address not found')

    return Response(data=address)

@router.delete("/{address_id}")
async def delete_address(address_id: uuid.UUID, address_service: CompanyAddressServiceDep) -> Response[AddressResponse]:
    address = await address_service.delete(address_id)
    if address is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company Address not found')

    return Response(message='Company Address was successfully deleted')



@router.get("/countries")
async def get_country_list(country_service: CountryServiceDep, request: CountryListParams = Depends(list_params_builder)) -> PaginatedResponse[list[CountryResponse]]:
    countries = await country_service.get_list(request, CountryResponse)
    country_items = [CountryResponse.model_validate(country).model_dump() for country in countries.items]
    return PaginatedResponse(data=country_items, meta=ResponseMeta(pagination=countries.pagination).model_dump())

@router.get("/countries/{country_id}/states")
async def get_states_by_country(country_id: int) -> Response[list[StateResponse]]:
    async for db in get_session():
        result = await db.execute(
            select(State).where(State.country_id == country_id, State.deleted_at.is_(None))
        )
        states = result.scalars().all()
        break
    return Response(data=[StateResponse.model_validate(s).model_dump() for s in states])