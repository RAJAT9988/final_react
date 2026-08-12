from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
import uuid
from app.company.schemas.company_branch import (
    CompanyBranchDTO,
    CompanyBranchCreateDTO,
    CompanyBranchUpdateDTO,
    CompanyBranchCreateRequest,
    CompanyBranchFilterParam,
    CompanyBranchListParams,
    CompanyBranchUpdateRequest,
    CompanyBranchResponse,
    CompanyBranchSortParam
)

from app.company.dependencies.services import CompanyBranchServiceDep, CompanyServiceDep

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

list_params_builder = ListParamsBuilder(CompanyBranchListParams, CompanyBranchSortParam, CompanyBranchFilterParam)

@router.post("/register-branch")
async def register_branch(request: CompanyBranchCreateRequest, company_service: CompanyServiceDep, branch_service: CompanyBranchServiceDep) -> Response[CompanyBranchResponse]:
    company = await company_service.get(request.company_id)
    if company is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Company not found")

    dto = CompanyBranchCreateDTO(**request.model_dump(exclude_none=True, exclude_unset=True))
    branch = await branch_service.register_branch(company_id=company, branch_data=dto)
    return Response(data=CompanyBranchResponse.model_validate(branch))

@router.get('')
async def get_list(
    company_branch_service: CompanyBranchServiceDep, request: CompanyBranchListParams = Depends(list_params_builder)
) -> PaginatedResponse[list[CompanyBranchResponse]]:
    companies = await company_branch_service.get_list(request, CompanyBranchResponse)
    company_items = [CompanyBranchResponse.model_validate(company) for company in companies.items]

    return PaginatedResponse(data=company_items, meta=ResponseMeta(pagination=companies.pagination))  

@router.get('/{company_branch_id}')
async def get(company_branch_id: uuid.UUID, company_branch_service: CompanyBranchServiceDep) -> Response[CompanyBranchResponse]:
    company = await company_branch_service.get(company_branch_id)

    if company is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company not found')

    return Response(data=CompanyBranchResponse.model_validate(company))   

@router.patch('/{company_branch_id}')
async def update_branch(company_branch_id: uuid.UUID,
                        request: CompanyBranchUpdateRequest,
                        company_branch_service: CompanyBranchServiceDep) -> Response[CompanyBranchResponse]:
    company_brach = await company_branch_service.update(company_branch_id, branch_data=CompanyBranchUpdateDTO(**request.model_dump(exclude_none=True, exclude_unset=True)))

    if company_brach is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company branch not found')

    return Response(data=company_brach)


@router.delete('/{company_branch_id}')
async def delete(company_branch_id: uuid.UUID, company_service: CompanyBranchServiceDep) -> Response[CompanyBranchResponse]:
    company_branch = await company_service.delete(company_branch_id)

    if company_branch is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail='Company Branch not found')

    return Response(message='Company branch was successfully deleted')