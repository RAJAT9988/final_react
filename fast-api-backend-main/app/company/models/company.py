from enum import Enum
import uuid
from sqlalchemy.dialects.postgresql import UUID
from app.company.models.company_branch import CompanyBranch
from sqlalchemy import SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import BaseModel, SoftDeleteMixin

class CompanyStatus(Enum):
    ACTIVE = 1
    INACTIVE = 2 

class Company(BaseModel, SoftDeleteMixin):
    __tablename__ = 'company'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_name: Mapped[str] = mapped_column(String(64), index=True, unique=True)
    contact_person_name: Mapped[str] = mapped_column(String(64), index=True)
    contact_person_email: Mapped[str] = mapped_column(String(120), index=True, unique=True)
    contact_person_phone: Mapped[str] = mapped_column(String(20), index=True, unique=True)
    contact_person_designation: Mapped[str] = mapped_column(String(64), index=True)
    company_description: Mapped[str] = mapped_column(String(256))
    status_id: Mapped[int] = mapped_column(SmallInteger(), index=True, default=CompanyStatus.ACTIVE.value)
    branches: Mapped[list['CompanyBranch']] = relationship('CompanyBranch', back_populates='company', cascade='all, delete-orphan') 


    def is_active(self) -> bool:
        return self.status_id == CompanyStatus.ACTIVE.value

