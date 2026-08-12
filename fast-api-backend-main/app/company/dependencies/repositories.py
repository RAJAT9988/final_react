from typing import Annotated

from fastapi import Depends

from app.company.models import Company, CompanyBranch, Address, Country
from app.company.repositories.address import AddressRepository, CountryRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.repositories.company import CompanyRepository
from app.core.deps import DBSessionDep

def get_company_repository(db: DBSessionDep) -> CompanyRepository:
    return CompanyRepository(db=db, model=Company)

def get_company_branch_repository(db: DBSessionDep) -> CompanyBranchRepository:
    return CompanyBranchRepository(db=db, model=CompanyBranch)

def get_address_repository(db: DBSessionDep) -> AddressRepository:
    return AddressRepository(db=db, model=Address)

def get_country_repository(db: DBSessionDep) -> CountryRepository:
    return CountryRepository(db=db, model=Country)

CountryRepoDep = Annotated[CountryRepository, Depends(get_country_repository)]
CompanyRepoDep = Annotated[CompanyRepository, Depends(get_company_repository)]
CompanyBranchRepoDep = Annotated[CompanyBranchRepository, Depends(get_company_branch_repository)]
AddressRepoDep = Annotated[AddressRepository, Depends(get_address_repository)]