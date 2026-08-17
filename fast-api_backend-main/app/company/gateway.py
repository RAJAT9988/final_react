import uuid
from abc import ABC, abstractmethod
from typing import Annotated, List
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.dependencies.services import (
    CompanyBranchServiceDep,
    CompanyServiceDep,
)
from app.company.schemas.company import CompanyDTO
from app.company.schemas.company_branch import CompanyBranchDTO


class CompanyGatewayInterface(ABC):
    """Abstract sync interface for cross-module access to company data."""

    @abstractmethod
    async def get_company(self, db: AsyncSession, company_id: uuid.UUID) -> CompanyDTO:
        pass

    @abstractmethod
    async def get_company_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CompanyDTO]:
        pass

    @abstractmethod
    async def get_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> CompanyBranchDTO:
        pass

    @abstractmethod
    async def get_branches_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[CompanyBranchDTO]:
        pass


class CompanyGateway(CompanyGatewayInterface):
    """Concrete cross-module Gateway delegating to company services."""

    def __init__(
        self,
        company_service: CompanyServiceDep,
        branch_service: CompanyBranchServiceDep,
    ) -> None:
        self.company_service = company_service
        self.branch_service = branch_service

    async def get_company(self, db: AsyncSession, company_id: uuid.UUID) -> CompanyDTO:
        return await self.company_service.get_by_id(db, company_id)

    async def get_company_list(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CompanyDTO]:
        return await self.company_service.list_companies(db, skip=skip, limit=limit)

    async def get_branch(
        self, db: AsyncSession, branch_id: uuid.UUID
    ) -> CompanyBranchDTO:
        return await self.branch_service.get_by_id(db, branch_id)

    async def get_branches_by_company(
        self, db: AsyncSession, company_id: uuid.UUID
    ) -> List[CompanyBranchDTO]:
        return await self.branch_service.list_branches_by_company(db, company_id)


def get_company_gateway(
    company_service: CompanyServiceDep,
    branch_service: CompanyBranchServiceDep,
) -> CompanyGateway:
    return CompanyGateway(
        company_service=company_service, branch_service=branch_service
    )


CompanyGatewayDep = Annotated[CompanyGateway, Depends(get_company_gateway)]
