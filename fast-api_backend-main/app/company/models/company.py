import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base_model import BaseModel, SoftDeleteMixin

if TYPE_CHECKING:
    from app.company.models.company_branch import CompanyBranch


class Company(BaseModel, SoftDeleteMixin):
    """Company entity model."""

    __tablename__ = "companies"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    company_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    contact_person_designation: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    contact_person_name: Mapped[Optional[str]] = mapped_column(
        String(150), nullable=True
    )
    contact_person_email: Mapped[Optional[str]] = mapped_column(
        String(150), nullable=True
    )
    contact_person_mobile_no: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )
    company_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    branches: Mapped[List["CompanyBranch"]] = relationship(
        "CompanyBranch", back_populates="company", cascade="all, delete-orphan"
    )
    # addresses: Mapped[List["Address"]] = relationship(
    #     "Address", back_populates="company", foreign_keys="Address.company_id"
    # )
