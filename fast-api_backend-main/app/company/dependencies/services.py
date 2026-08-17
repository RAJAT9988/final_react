from typing import Annotated
from fastapi import Depends

from app.company.dependencies.repositories import (
    AddressRepositoryDep,
    CompanyBranchRepositoryDep,
    CompanyRepositoryDep,
    CountryRepositoryDep,
    StateRepositoryDep,
)
from app.company.services.address import AddressService
from app.company.services.company import CompanyService
from app.company.services.company_branch import CompanyBranchService
from app.company.services.country import CountryService
from app.company.services.state import StateService


def get_country_service(
    country_repo: CountryRepositoryDep,
) -> CountryService:
    return CountryService(country_repo=country_repo)


def get_state_service(
    state_repo: StateRepositoryDep,
) -> StateService:
    return StateService(state_repo=state_repo)


def get_address_service(
    address_repo: AddressRepositoryDep,
) -> AddressService:
    return AddressService(address_repo=address_repo)


def get_company_service(
    company_repo: CompanyRepositoryDep,
) -> CompanyService:
    return CompanyService(company_repo=company_repo)


def get_company_branch_service(
    branch_repo: CompanyBranchRepositoryDep,
    company_repo: CompanyRepositoryDep,
) -> CompanyBranchService:
    return CompanyBranchService(branch_repo=branch_repo, company_repo=company_repo)


CountryServiceDep = Annotated[CountryService, Depends(get_country_service)]
StateServiceDep = Annotated[StateService, Depends(get_state_service)]
AddressServiceDep = Annotated[AddressService, Depends(get_address_service)]
CompanyServiceDep = Annotated[CompanyService, Depends(get_company_service)]
CompanyBranchServiceDep = Annotated[
    CompanyBranchService, Depends(get_company_branch_service)
]
