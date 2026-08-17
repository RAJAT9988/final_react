from fastapi import APIRouter

from app.device.routes.v1.company_device import router as company_device_router
from app.device.routes.v1.device import router as device_router
from app.device.routes.v1.device_camera_assignment import (
    router as camera_assignment_router,
)
from app.device.routes.v1.device_health import router as health_router
from app.device.routes.v1.device_model_subscription import (
    router as subscription_router,
)

router_v1 = APIRouter(prefix="/v1")

router_v1.include_router(device_router)
router_v1.include_router(company_device_router)
router_v1.include_router(health_router)
router_v1.include_router(subscription_router)
router_v1.include_router(camera_assignment_router)
