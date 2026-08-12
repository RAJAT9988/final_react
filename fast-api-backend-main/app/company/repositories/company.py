from app.company.models.company import Company
from app.company.schemas.company import CompanyCreateDTO, CompanyUpdateRequest
from app.core.db import BaseRepository


class CompanyRepository(
    BaseRepository[Company, CompanyCreateDTO, CompanyUpdateRequest]
):
    async def get_by_company_name(self, company_name: str) -> Company | None:
        result = await self._db.execute(
            Company.select_not_deleted().where(
                Company.company_name == company_name
            )
        )
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Company | None:
        result = await self._db.execute(
            Company.select_not_deleted().where(
                Company.contact_person_email == email
            )
        )
        return result.scalars().first()

    async def create(self, data: CompanyCreateDTO) -> Company:
        modified = data.model_copy()
        return await super().create(modified)

    async def update(self, model: Company, data: CompanyUpdateRequest) -> Company:
        modified = data.model_copy()
        return await super().update(model=model, data=modified)


    

    