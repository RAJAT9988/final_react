import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Float, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.company.models.company_branch import CompanyBranch
    from app.company.models.country import Country
    from app.company.models.state import State


class Address(BaseModel, SoftDeleteMixin):
    """Address model for companies and branches."""

    __tablename__ = "addresses"

    address_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    country_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("countries.country_id"),
        nullable=False,
        index=True,
    )
    state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("states.state_id"), nullable=False, index=True
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_branches.branch_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    area: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    locality: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    landmark: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    street: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    country: Mapped["Country"] = relationship("Country")
    state: Mapped["State"] = relationship("State")

    company_branch: Mapped["CompanyBranch"] = relationship(
        "CompanyBranch", back_populates="addresses", foreign_keys=[branch_id]
    )
