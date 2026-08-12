from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from app.company.gateway import CompanyGateway as CompanyGatewayClass
from app.company.gateway import CompanyGatewayInterface

from app.company.dependencies.repositories import AddressRepoDep, CompanyBranchRepoDep, CompanyRepoDep, CountryRepoDep
from app.company.models import Company, CompanyBranch, Address
from app.company.services.company import CompanyService 
from app.company.services.company_branch import CompanyBranchService
from app.company.services.address import AddressService, CountryService
from app.company.schemas.company import CompanyDTO
from app.core.configs import app_config
from app.core.deps import EventsServiceDep

async def get_company_service(
        company_repo: CompanyRepoDep,
        company_branch_repo: CompanyBranchRepoDep,
        address_repo: AddressRepoDep,
        events: EventsServiceDep
) -> CompanyService:
    return CompanyService(
        company_repo=company_repo,
        company_branch_repo=company_branch_repo,
        address_repo=address_repo,
        events=events
    )

async def get_company_branch_service(
        company_repo: CompanyRepoDep,
        company_branch_repo: CompanyBranchRepoDep,
        address_repo: AddressRepoDep,
        events: EventsServiceDep
) -> CompanyBranchService:
    return CompanyBranchService(
        company_repo=company_repo,
        branch_repo=company_branch_repo,
        # address_repo=address_repo,
        events=events
    )

async def get_company_branch_address(
        company_repo: CompanyRepoDep,
        company_branch_repo: CompanyBranchRepoDep,
        address_repo: AddressRepoDep,
        events: EventsServiceDep
) -> AddressService:
    return AddressService(
        # company_repo=company_repo,
        branch_repo=company_branch_repo,
        address_repo=address_repo,
        # events=events
    )

async def get_gateway(company_service: Annotated[CompanyService, Depends(get_company_service)]) -> CompanyGatewayInterface:
    return CompanyGatewayClass(company_service=company_service)

class CurrentCompanyGetter:
    def __init__(self, schema: type[BaseModel] | None = None):
        self._schema = schema

    async def __call__(
        self,
        company_service: Annotated[CompanyService, Depends(get_company_service)],
        company_id: int
    ) -> Company | BaseModel:
        company = await company_service.get(company_id)

        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Company not found',
            )

        return self._schema(**company.to_dict()) if self._schema else company   
    
class ActiveCompanyGetter:
    def __init__(self, schema: type[BaseModel] | None = None):
        self._schema = schema

    async def __call__(self, company: Annotated[Company, Depends(CurrentCompanyGetter())]) -> Company | BaseModel:
        if not company.is_active():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Company is not active',
            )

        return self._schema(**company.to_dict()) if self._schema else company


async def get_country_service(
    country_repo: CountryRepoDep,
) -> CountryService:
    return CountryService(country_repo=country_repo)

CountryServiceDep = Annotated[CountryService, Depends(get_country_service)]
CompanyServiceDep = Annotated[CompanyService, Depends(get_company_service)]
CompanyBranchServiceDep = Annotated[CompanyBranchService, Depends(get_company_branch_service)]
CompanyAddressServiceDep = Annotated[AddressService, Depends(get_company_branch_address)]
RegisterCompanyServiceDep = Annotated[CompanyService, Depends(get_company_service)]

CurrentCompanyDep = Annotated[Company, Depends(CurrentCompanyGetter())]
ActiveCompanyDep = Annotated[Company, Depends(ActiveCompanyGetter())]

CurrentCompany = Annotated[Company, Depends(CurrentCompanyGetter(CompanyDTO))]
ActiveCompany = Annotated[Company, Depends(ActiveCompanyGetter(CompanyDTO))]
CompanyGateway = Annotated[CompanyGatewayInterface, Depends(get_gateway)]