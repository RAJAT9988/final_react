import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.company.models.address import Address
    from app.company.models.company import Company


class CompanyBranch(BaseModel, SoftDeleteMixin):
    """Company Branch entity model."""

    __tablename__ = "company_branches"

    branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    branch_contact_person_designation: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    branch_contact_person_name: Mapped[Optional[str]] = mapped_column(
        String(150), nullable=True
    )
    branch_contact_person_email: Mapped[Optional[str]] = mapped_column(
        String(150), nullable=True
    )
    branch_contact_person_mobile_no: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )

    company: Mapped["Company"] = relationship("Company", back_populates="branches")
    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="company_branch", cascade="all, delete-orphan"
    )
