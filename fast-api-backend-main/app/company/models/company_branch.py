import uuid
from sqlalchemy.dialects.postgresql import UUID
from app.company.models.address import Address
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.db import BaseModel, SoftDeleteMixin

class CompanyBranch(BaseModel, SoftDeleteMixin):
    __tablename__ = 'company_branches'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('company.id'),
        nullable=False,
    )
    branch_name: Mapped[str] = mapped_column(String(64), index=True)
    branch_contact_person_name: Mapped[str] = mapped_column(String(64), index=True)
    branch_contact_person_email: Mapped[str] = mapped_column(String(120), index=True, unique=True)
    branch_contact_person_phone: Mapped[str] = mapped_column(String(20), index=True, unique=True)
    branch_contact_person_designation: Mapped[str] = mapped_column(String(64), index=True)

    company: Mapped['Company'] = relationship('Company', back_populates='branches')

    addresses: Mapped[list['Address']] = relationship('Address', back_populates='company_branch', cascade='all, delete-orphan')