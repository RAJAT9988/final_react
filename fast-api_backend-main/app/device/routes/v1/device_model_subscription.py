import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, status

from app.core.deps import DBSessionDep
from app.device.dependencies.services import DeviceModelSubscriptionServiceDep
from app.device.http import handle_device_errors
from app.device.schemas.device_model_subscription import (
    DeviceModelSubscriptionCreate,
    DeviceModelSubscriptionDTO,
    DeviceModelSubscriptionUpdate,
)
from app.user_management.dependencies.auth import RequirePermission
from app.user_management.schemas.user import UserDTO

router = APIRouter(tags=["Device Model Subscriptions"])


@router.get(
    "/devices/{id}/model-subscriptions",
    response_model=List[DeviceModelSubscriptionDTO],
)
@handle_device_errors
async def list_model_subscriptions(
    id: uuid.UUID,
    db: DBSessionDep,
    service: DeviceModelSubscriptionServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("view_device_overview"))],
) -> List[DeviceModelSubscriptionDTO]:
    return await service.list_by_device(db=db, device_id=id, actor=actor)


@router.post(
    "/devices/{id}/model-subscriptions",
    response_model=DeviceModelSubscriptionDTO,
    status_code=status.HTTP_201_CREATED,
)
@handle_device_errors
async def create_model_subscription(
    id: uuid.UUID,
    body: DeviceModelSubscriptionCreate,
    db: DBSessionDep,
    service: DeviceModelSubscriptionServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("start_stop_inference"))],
) -> DeviceModelSubscriptionDTO:
    return await service.create_subscription(
        db=db, device_id=id, obj_in=body, actor=actor
    )


@router.patch(
    "/model-subscriptions/{id}",
    response_model=DeviceModelSubscriptionDTO,
)
@handle_device_errors
async def update_model_subscription(
    id: uuid.UUID,
    body: DeviceModelSubscriptionUpdate,
    db: DBSessionDep,
    service: DeviceModelSubscriptionServiceDep,
    actor: Annotated[UserDTO, Depends(RequirePermission("start_stop_inference"))],
) -> DeviceModelSubscriptionDTO:
    return await service.update_subscription(
        db=db, subscription_id=id, obj_in=body, actor=actor
    )
