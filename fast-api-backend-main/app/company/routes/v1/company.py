from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
import uuid
from app.company.schemas.company import (
    CompanyCreateDTO,
    CompanyUpdateDTO,
    CompanyCreateRequest,
    CompanyFilterParam,
    CompanyListParams,
    CompanyResponse,
    CompanySortParam,
    CompanyUpdateRequest
)
from app.company.dependencies.services import ActiveCompanyDep, CompanyRepoDep, CompanyServiceDep, RegisterCompanyServiceDep
from app.core.api import (
    ConfigurableRateLimiter,
    ListParamsBuilder,
    PaginatedResponse,
    Response,
    ResponseMeta,
)

router = APIRouter(
    dependencies=[
        Depends(ConfigurableRateLimiter(times=50, seconds=60)),
    ]
)

list_params_builder = ListParamsBuilder(CompanyListParams, CompanySortParam, CompanyFilterParam)

@router.post("/register-company")
async def register_company(
   request: CompanyCreateRequest, company_service: RegisterCompanyServiceDep) -> Response[CompanyResponse]:
    company = await company_service.register_company(CompanyCreateDTO(**request.model_dump(exclude_none=True, exclude_unset=True)))

    # return Response(data=CompanyResponse.model_validate(company))
    return Response(data=company)

@router.get('')
async def get_list(
    company_service: CompanyServiceDep, request: CompanyListParams = Depends(list_params_builder)
) -> PaginatedResponse[list[CompanyResponse]]:
    companies = await company_service.get_list(request, CompanyResponse)
    company_items = [CompanyResponse.model_validate(company) for company in companies.items]

    return PaginatedResponse(data=company_items, meta=ResponseMeta(pagination=companies.pagination))  

@router.get('/{company_id}')
async def get(company_id: uuid.UUID, company_service: CompanyServiceDep) -> Response[CompanyResponse]:
    company = await company_service.get(company_id)

    if company is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company not found')

    return Response(data=CompanyResponse.model_validate(company))   

@router.patch('/{company_id}')
async def update(
    company_id: uuid.UUID,
    request: CompanyUpdateRequest,
    company: ActiveCompanyDep,
    company_service: CompanyServiceDep
) -> Response[CompanyResponse]:
    company = await company_service.update(company_id, company=company, company_data=CompanyUpdateDTO(**request.model_dump(exclude_none=True, exclude_unset=True)))

    if company is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company not found')

    return Response(data=company)   

@router.delete('/{company_id}')
async def delete(company_id: uuid.UUID, company_service: CompanyServiceDep) -> Response[CompanyResponse]:
    company = await company_service.delete(company_id)

    if company is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company not found')

    return Response(message='Company was successfully deleted')