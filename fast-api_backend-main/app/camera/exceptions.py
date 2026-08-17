import uuid


class CameraModuleException(Exception):
    """Base exception for all camera module domain errors."""

    status_code: int = 400

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class CameraNotFoundException(CameraModuleException):
    """Raised when a requested camera is not found."""

    status_code = 404

    def __init__(self, camera_id: uuid.UUID) -> None:
        self.camera_id = camera_id
        super().__init__(f"Camera with ID {camera_id} not found.")


class CameraCompanyDeviceNotFoundException(CameraModuleException):
    """Raised when the referenced company_device does not exist."""

    status_code = 404

    def __init__(self, company_device_id: uuid.UUID) -> None:
        self.company_device_id = company_device_id
        super().__init__(f"Company device assignment {company_device_id} not found.")


class InvalidCameraTypeException(CameraModuleException):
    """Raised when camera_type is not RTSP/USB/MIPI."""

    status_code = 400

    def __init__(self, camera_type: str) -> None:
        self.camera_type = camera_type
        super().__init__(f"Invalid camera type: {camera_type}.")


class InvalidCameraStatusException(CameraModuleException):
    """Raised when camera_status is not online/offline/disconnected."""

    status_code = 400

    def __init__(self, camera_status: str) -> None:
        self.camera_status = camera_status
        super().__init__(f"Invalid camera status: {camera_status}.")
