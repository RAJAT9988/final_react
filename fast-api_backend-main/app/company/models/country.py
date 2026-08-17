import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel

if TYPE_CHECKING:
    from app.company.models.state import State


class Country(BaseModel):
    """Country reference table."""

    __tablename__ = "countries"

    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    country_name: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )

    states: Mapped[List["State"]] = relationship(
        "State", back_populates="country", cascade="all, delete-orphan"
    )
