import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.db import BaseModel, SoftDeleteMixin

class Address(BaseModel, SoftDeleteMixin):
    __tablename__ = 'address'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('company_branches.id'),
        nullable=False,)
    country_id: Mapped[int] = mapped_column(ForeignKey('country.id'), nullable=False)
    state_id: Mapped[int] = mapped_column(ForeignKey('state.id'), nullable=False)
    area: Mapped[str] = mapped_column(String(128), index=True)
    landmark: Mapped[str] = mapped_column(String(128), index=True)
    lattitude: Mapped[str] = mapped_column(String(64), index=True)
    longitude: Mapped[str] = mapped_column(String(64), index=True)
    city: Mapped[str] = mapped_column(String(64), index=True)

    postal_code: Mapped[str] = mapped_column(String(20), index=True)

    company_branch: Mapped['CompanyBranch'] = relationship('CompanyBranch', back_populates='addresses')

class Country(BaseModel, SoftDeleteMixin):
    __tablename__ = 'country'

    id: Mapped[int] = mapped_column(primary_key=True)
    country_name: Mapped[str] = mapped_column(String(64), index=True, unique=True)

    states: Mapped[list['State']] = relationship('State', back_populates='country', cascade='all, delete-orphan')

class State(BaseModel, SoftDeleteMixin):
    __tablename__ = 'state'

    id: Mapped[int] = mapped_column(primary_key=True)
    state_name: Mapped[str] = mapped_column(String(64), index=True, unique=True)
    country_id: Mapped[int] = mapped_column(ForeignKey('country.id'), nullable=False)

    country: Mapped['Country'] = relationship('Country', back_populates='states')

    # cities: Mapped[list['City']] = relationship('City', back_populates='state', cascade='all, delete-orphan')

# class City(BaseModel, SoftDeleteMixin):
#     __tablename__ = 'city'

#     id: Mapped[int] = mapped_column(primary_key=True)
#     city_name: Mapped[str] = mapped_column(String(64), index=True, unique=True)
#     state_id: Mapped[int] = mapped_column(ForeignKey('state.id'), nullable=False)

#     state: Mapped['State'] = relationship('State', back_populates='cities')