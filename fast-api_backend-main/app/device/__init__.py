from typing import Any

from app.device.gateway import DeviceGateway, DeviceGatewayDep
from app.device.schemas.company_device import CompanyDeviceDTO
from app.device.schemas.device import DeviceDTO
from app.device.schemas.device_camera_assignment import DeviceCameraAssignmentDTO
from app.device.schemas.device_model_subscription import DeviceModelSubscriptionDTO

__all__ = [
    "DeviceGateway",
    "DeviceGatewayDep",
    "DeviceDTO",
    "CompanyDeviceDTO",
    "DeviceModelSubscriptionDTO",
    "DeviceCameraAssignmentDTO",
    "router_v1",
]


def __getattr__(name: str) -> Any:
    """Lazy-load router so importing DeviceGateway does not pull camera routes."""
    if name == "router_v1":
        from app.device.routers import router_v1

        return router_v1
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
