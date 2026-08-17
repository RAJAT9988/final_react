import uuid


class CompanyModuleException(Exception):
    """Base exception for all company module domain errors."""

    pass


class CompanyNotFoundException(CompanyModuleException):
    """Raised when a requested company is not found."""

    def __init__(self, company_id: uuid.UUID):
        self.company_id = company_id
        super().__init__(f"Company with ID {company_id} not found.")


class CompanyBranchNotFoundException(CompanyModuleException):
    """Raised when a requested company branch is not found."""

    def __init__(self, branch_id: uuid.UUID):
        self.branch_id = branch_id
        super().__init__(f"Company branch with ID {branch_id} not found.")


class AddressNotFoundException(CompanyModuleException):
    """Raised when a requested address is not found."""

    def __init__(self, address_id: uuid.UUID):
        self.address_id = address_id
        super().__init__(f"Address with ID {address_id} not found.")


class CountryNotFoundException(CompanyModuleException):
    """Raised when a requested country is not found."""

    def __init__(self, country_id: uuid.UUID):
        self.country_id = country_id
        super().__init__(f"Country with ID {country_id} not found.")


class StateNotFoundException(CompanyModuleException):
    """Raised when a requested state is not found."""

    def __init__(self, state_id: uuid.UUID):
        self.state_id = state_id
        super().__init__(f"State with ID {state_id} not found.")


class CompanyHasActiveDevicesException(CompanyModuleException):
    """Raised when attempting to delete a company that has active devices assigned."""

    def __init__(self, company_id: uuid.UUID):
        self.company_id = company_id
        super().__init__(
            f"Cannot delete company {company_id} because active devices are assigned to it."
        )
