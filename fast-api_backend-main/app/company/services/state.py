import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.company.exceptions import StateNotFoundException
from app.company.repositories.state import StateRepository
from app.company.schemas.state import StateCreate, StateDTO, StateUpdate


class StateService:
    """Service handling State business logic."""

    def __init__(self, state_repo: StateRepository) -> None:
        self.state_repo = state_repo

    async def get_by_id(self, db: AsyncSession, state_id: uuid.UUID) -> StateDTO:
        state = await self.state_repo.get_by_id(db, state_id)
        if not state:
            raise StateNotFoundException(state_id)
        return StateDTO.model_validate(state)

    async def get_by_country(
        self, db: AsyncSession, country_id: uuid.UUID
    ) -> List[StateDTO]:
        states = await self.state_repo.get_by_country(db, country_id)
        return [StateDTO.model_validate(s) for s in states]

    async def create_state(self, db: AsyncSession, obj_in: StateCreate) -> StateDTO:
        state = await self.state_repo.create(db, obj_in.model_dump())
        return StateDTO.model_validate(state)

    async def update_state(
        self, db: AsyncSession, state_id: uuid.UUID, obj_in: StateUpdate
    ) -> StateDTO:
        state = await self.state_repo.get_by_id(db, state_id)
        if not state:
            raise StateNotFoundException(state_id)
        updated = await self.state_repo.update(
            db, state, obj_in.model_dump(exclude_unset=True)
        )
        return StateDTO.model_validate(updated)
