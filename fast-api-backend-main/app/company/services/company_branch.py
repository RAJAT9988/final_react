from app.company.repositories.company_branch import CompanyBranchRepository
from app.company.repositories.company import CompanyRepository
from app.company.models.company_branch import CompanyBranch
from app.company.schemas.company_branch import CompanyBranchCreateDTO, CompanyBranchUpdateRequest
from app.company.exceptions import CompanyNotFoundException, CompanyBranchNotFoundException
from app.core.services.events import EventsServiceInterface
from uuid import UUID

class CompanyBranchService:
    def __init__(self, branch_repo: CompanyBranchRepository, company_repo: CompanyRepository, events: EventsServiceInterface):
        self.repository = branch_repo
        self._company_repo = company_repo
        self._events = events

    async def register_branch(self, company_id: UUID, branch_data: CompanyBranchCreateDTO) -> CompanyBranch:
        branch = await self.repository.create(branch_data)
        await self.repository.commit()
        return branch

    async def get_list(self, params, schema):
        return await self.repository.get_list(params, schema)

    async def get(self, branch_id: UUID) -> CompanyBranch | None:
        return await self.repository.get(branch_id)

    async def update(self, branch_id: UUID, branch_data: CompanyBranchUpdateRequest) -> CompanyBranch:
        branch = await self.repository.get(branch_id)
        if branch is None:
            raise CompanyBranchNotFoundException()

        branch = await self.repository.update(model=branch, data=branch_data)
        await self.repository.commit()
        return branch

    async def delete(self, branch_id: UUID) -> CompanyBranch | None:
        branch = await self.repository.get(branch_id)
        if branch is None:
            return None

        await self.repository.delete(model=branch)
        await self.repository.commit()
        return branch