from app.device.schemas.company_device import (
    CompanyDeviceDTO,
    DeviceApprovalAction,
    DeviceReassign,
)
from app.device.schemas.device import (
    DeviceCreate,
    DeviceDTO,
    DeviceUpdate,
    SlaveRegisterRequest,
    SlaveRegisterResponse,
)
from app.device.schemas.device_camera_assignment import (
    DeviceCameraAssignmentCreate,
    DeviceCameraAssignmentDTO,
    DeviceCameraAssignmentUpdate,
)
from app.device.schemas.device_health import DeviceHealthCreate, DeviceHealthDTO
from app.device.schemas.device_model_subscription import (
    DeviceModelSubscriptionCreate,
    DeviceModelSubscriptionDTO,
    DeviceModelSubscriptionUpdate,
)

__all__ = [
    "DeviceCreate",
    "DeviceUpdate",
    "DeviceDTO",
    "SlaveRegisterRequest",
    "SlaveRegisterResponse",
    "CompanyDeviceDTO",
    "DeviceReassign",
    "DeviceApprovalAction",
    "DeviceHealthCreate",
    "DeviceHealthDTO",
    "DeviceModelSubscriptionCreate",
    "DeviceModelSubscriptionUpdate",
    "DeviceModelSubscriptionDTO",
    "DeviceCameraAssignmentCreate",
    "DeviceCameraAssignmentUpdate",
    "DeviceCameraAssignmentDTO",
]
