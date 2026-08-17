import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.exceptions import CountryNotFoundException
from app.company.repositories.country import CountryRepository
from app.company.schemas.country import CountryCreate, CountryDTO, CountryUpdate


class CountryService:
    """Service handling Country business logic."""

    def __init__(self, country_repo: CountryRepository) -> None:
        self.country_repo = country_repo

    async def get_by_id(self, db: AsyncSession, country_id: uuid.UUID) -> CountryDTO:
        country = await self.country_repo.get_by_id(db, country_id)
        if not country:
            raise CountryNotFoundException(country_id)
        return CountryDTO.model_validate(country)

    async def list_countries(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[CountryDTO]:
        countries = await self.country_repo.get_multi(db, skip=skip, limit=limit)
        return [CountryDTO.model_validate(c) for c in countries]

    async def create_country(
        self, db: AsyncSession, obj_in: CountryCreate
    ) -> CountryDTO:
        country = await self.country_repo.create(db, obj_in.model_dump())
        return CountryDTO.model_validate(country)

    async def update_country(
        self, db: AsyncSession, country_id: uuid.UUID, obj_in: CountryUpdate
    ) -> CountryDTO:
        country = await self.country_repo.get_by_id(db, country_id)
        if not country:
            raise CountryNotFoundException(country_id)
        updated = await self.country_repo.update(
            db, country, obj_in.model_dump(exclude_unset=True)
        )
        return CountryDTO.model_validate(updated)
