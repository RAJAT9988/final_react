from fastapi import HTTPException, status

from app.core.api import GeneralException, ResponseStatus

class InvalidInput(GeneralException):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_400_BAD_REQUEST),
            status=ResponseStatus.INVALID_INPUT,
        )

class ActionNotAllowed(GeneralException):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_403_FORBIDDEN),
            status=ResponseStatus.ACTION_NOT_ALLOWED,
        )

class CompanyAlreadyExistsException(GeneralException):
    def __init__(self, message: str = "Company already exists", status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_400_BAD_REQUEST),
            status=ResponseStatus.INVALID_INPUT,
        )

class CompanyNotFoundException(GeneralException):
    def __init__(self, message: str = "Company not found", status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_404_NOT_FOUND),
            status=ResponseStatus.NOT_FOUND_ERROR,
        )

class CompanyBranchNotFoundException(GeneralException):
    def __init__(self, message: str = "Branch not found", status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_404_NOT_FOUND),
            status=ResponseStatus.NOT_FOUND_ERROR,
        )

class AddressNotFoundException(GeneralException):
    def __init__(self, message: str = "Address not found", status_code: int | None = None):
        super().__init__(
            message=message,
            status_code=(status_code or status.HTTP_404_NOT_FOUND),
            status=ResponseStatus.NOT_FOUND_ERROR,
        )