from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db.base_model import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Generic base repository providing common CRUD operations."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        stmt = select(self.model).where(
            getattr(
                self.model,
                f"{self.model.__tablename__.singularize() if hasattr(self.model.__tablename__, 'singularize') else self.model.__name__.lower()}_id",
                getattr(self.model, "id", None),
            )
            == id
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Fetch multiple records with offset and limit."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, obj_in: dict[str, Any]) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        """Update an existing record."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def soft_delete(self, db: AsyncSession, db_obj: ModelType) -> ModelType:
        """Soft delete a record by setting is_deleted=True."""
        if hasattr(db_obj, "is_deleted"):
            setattr(db_obj, "is_deleted", True)
            db.add(db_obj)
            await db.flush()
            await db.refresh(db_obj)
        return db_obj
