from app.company.models.company_branch import CompanyBranch
from app.company.schemas.company_branch import (
    CompanyBranchCreateDTO,
    CompanyBranchUpdateRequest,
)
from app.core.db import BaseRepository
from uuid import UUID

class CompanyBranchRepository(
    BaseRepository[
        CompanyBranch,
        CompanyBranchCreateDTO,
        CompanyBranchUpdateRequest,
    ]
):
    async def list_by_company(self, company_id: UUID):
        result = await self._db.execute(
            CompanyBranch.select_not_deleted().where(
                CompanyBranch.company_id == company_id
            )
        )
        return result.scalars().all()

    async def create(self, data: CompanyBranchCreateDTO) -> CompanyBranch:
        modified = data.model_copy()
        return await super().create(modified)

    async def update(self, model: CompanyBranch, data: CompanyBranchUpdateRequest) -> CompanyBranch:
            modified = data.model_copy()
            return await super().update(model=model, data=modified)
    
        