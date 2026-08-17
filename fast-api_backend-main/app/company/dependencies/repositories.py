from typing import Annotated
from fastapi import Depends

from app.company.repositories.address import AddressRepository
from app.company.repositories.company import CompanyRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.repositories.country import CountryRepository
from app.company.repositories.state import StateRepository


def get_country_repository() -> CountryRepository:
    return CountryRepository()


def get_state_repository() -> StateRepository:
    return StateRepository()


def get_address_repository() -> AddressRepository:
    return AddressRepository()


def get_company_repository() -> CompanyRepository:
    return CompanyRepository()


def get_company_branch_repository() -> CompanyBranchRepository:
    return CompanyBranchRepository()


CountryRepositoryDep = Annotated[CountryRepository, Depends(get_country_repository)]
StateRepositoryDep = Annotated[StateRepository, Depends(get_state_repository)]
AddressRepositoryDep = Annotated[AddressRepository, Depends(get_address_repository)]
CompanyRepositoryDep = Annotated[CompanyRepository, Depends(get_company_repository)]
CompanyBranchRepositoryDep = Annotated[
    CompanyBranchRepository, Depends(get_company_branch_repository)
]
