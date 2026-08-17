import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel

if TYPE_CHECKING:
    from app.company.models.country import Country


class State(BaseModel):
    """State reference table."""

    __tablename__ = "states"

    state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("countries.country_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    state_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    country: Mapped["Country"] = relationship("Country", back_populates="states")
