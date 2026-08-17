import uuid
from typing import List
from fastapi import APIRouter

from app.company.dependencies.services import CountryServiceDep, StateServiceDep
from app.company.schemas.country import CountryDTO
from app.company.schemas.state import StateDTO
from app.core.deps import DBSessionDep

router = APIRouter(tags=["Countries"])


@router.get("/countries", response_model=List[CountryDTO])
async def list_countries(
    db: DBSessionDep,
    service: CountryServiceDep,
    skip: int = 0,
    limit: int = 100,
) -> List[CountryDTO]:
    return await service.list_countries(db=db, skip=skip, limit=limit)


@router.get("/countries/{id}/states", response_model=List[StateDTO])
async def list_country_states(
    id: uuid.UUID,
    db: DBSessionDep,
    service: StateServiceDep,
) -> List[StateDTO]:
    return await service.get_by_country(db=db, country_id=id)
