from abc import ABC, abstractmethod

from app.company.schemas.company import CompanyDTO
from app.company.schemas.company_branch import CompanyBranchCreateDTO as CompanyBranchDTO
from app.company.schemas.address import AddressCreateDTO as AddressDTO
# from app.company.services import CompanyService
from app.core.db import ListParams, PaginatedResult

class CompanyGatewayInterface(ABC):
    @abstractmethod
    async def get_company(self, company_id: int) -> CompanyDTO | None:
        """
        Returns Company model by given company_id.
        """
        raise NotImplementedError

    @abstractmethod
    async def get_company_list(self, params: ListParams) -> PaginatedResult[CompanyDTO]:
        """
        Returns PaginatedResult with a list of Company models. ListParams input parameter can be used
        to pass pagination, sort and filter parameters
        """
        raise NotImplementedError

    @abstractmethod
    async def get_company_branch(self, branch_id: int) -> CompanyBranchDTO | None:
        """
        Returns CompanyBranch model by given branch_id.
        """
        raise NotImplementedError

    @abstractmethod
    async def get_company_branch_list(
        self, company_id: int, params: ListParams
    ) -> PaginatedResult[CompanyBranchDTO]:
        """
        Returns PaginatedResult with a list of CompanyBranch models. ListParams input parameter can be used
        to pass pagination, sort and filter parameters
        """
        raise NotImplementedError

    @abstractmethod
    async def get_address(self, address_id: int) -> AddressDTO | None:
        """
        Returns Address model by given address_id.
        """
        raise NotImplementedError

class CompanyGateway(CompanyGatewayInterface):
    # def __init__(self, company_service: CompanyService) -> None:
    #     self._company_service = company_service

    async def get_company(self, company_id: int) -> CompanyDTO | None:
        company = await self._company_service.get(company_id)

        return CompanyDTO(**company.to_dict()) if company else None

    async def get_company_list(self, params: ListParams) -> PaginatedResult[CompanyDTO]:
        return await self._company_service.get_list(params, CompanyDTO)

    async def get_company_branch(self, branch_id: int) -> CompanyBranchDTO | None:
        branch = await self._company_service.get_branch(branch_id)

        return CompanyBranchDTO(**branch.to_dict()) if branch else None

    async def get_company_branch_list(
        self, company_id: int, params: ListParams
    ) -> PaginatedResult[CompanyBranchDTO]:
        return await self._company_service.get_branch_list(
            company_id=company_id, params=params, dto_class=CompanyBranchDTO
        )

    async def get_address(self, address_id: int) -> AddressDTO | None:
        address = await self._company_service.get_address(address_id)

        return AddressDTO(**address.to_dict()) if address else None