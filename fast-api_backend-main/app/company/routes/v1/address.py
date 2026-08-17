import uuid
from fastapi import APIRouter, status

from app.company.dependencies.services import AddressServiceDep
from app.company.schemas.address import AddressCreate, AddressDTO, AddressUpdate
from app.core.deps import DBSessionDep

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("/{id}", response_model=AddressDTO)
async def get_address(
    id: uuid.UUID,
    db: DBSessionDep,
    service: AddressServiceDep,
) -> AddressDTO:
    return await service.get_by_id(db=db, address_id=id)


@router.post("", response_model=AddressDTO, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_in: AddressCreate,
    db: DBSessionDep,
    service: AddressServiceDep,
) -> AddressDTO:
    return await service.create_address(db=db, obj_in=address_in)


@router.patch("/{id}", response_model=AddressDTO)
async def update_address(
    id: uuid.UUID,
    address_in: AddressUpdate,
    db: DBSessionDep,
    service: AddressServiceDep,
) -> AddressDTO:
    return await service.update_address(db=db, address_id=id, obj_in=address_in)


@router.delete("/{id}", response_model=AddressDTO)
async def delete_address(
    id: uuid.UUID,
    db: DBSessionDep,
    service: AddressServiceDep,
) -> AddressDTO:
    return await service.delete_address(db=db, address_id=id)
