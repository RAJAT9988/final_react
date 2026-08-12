from datetime import datetime
from app.company.repositories.company import CompanyRepository
from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.repositories.address import AddressRepository
from app.company.models import Company, CompanyBranch, Address
from app.company.schemas.company import (
    CompanyCreateDTO,
    CompanyUpdateDTO
)
from app.company.events import CompanyCreated, CompanyDeleted
from app.core.services.events import EventsServiceInterface
from app.company.exceptions import CompanyAlreadyExistsException, CompanyNotFoundException
import uuid

class CompanyService:

    def __init__(
        self,
        company_repo: CompanyRepository,
        company_branch_repo: CompanyBranchRepository,
        address_repo: AddressRepository,
        events: EventsServiceInterface

    ):
        self.repository = company_repo
        self._events = events

    async def register_company(
        self,
        company_data: CompanyCreateDTO) -> Company:
        company = await self.repository.get_by_company_name(company_data.company_name)
        if company:
            raise CompanyAlreadyExistsException("Company already exists")
        
        try:
            company = await self.repository.create(company_data)
            await self.repository.commit()
        except Exception as e:
            raise CompanyAlreadyExistsException("Company already exists")

        # self._events.dispatch(CompanyCreated(**company.to_dict()))

        return company

    async def get_list(self, params, response_model):
        return await self.repository.get_list(params, response_model)   

    async def get(self, company_id: uuid.UUID):
        return await self.repository.get(company_id)

    async def update(
        self,
        company_id: uuid.UUID,
        company: Company,
        company_data: CompanyUpdateDTO,
    ) -> Company:
        company = await self.repository.get(company_id)

        company = await self.repository.update(model=company, data=company_data)
        await self.repository.commit()
        return company

    async def delete(self, company_id: uuid.UUID) -> Company:
        company = await self.repository.get(company_id)
        if company is None:
            return None

        await self.repository.delete(company=company)
        await self.repository.commit()
        return company