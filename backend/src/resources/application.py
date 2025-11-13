import dataclasses

from backend.src.resources.types import Country


@dataclasses.dataclass
class Application:
    applicant_name: str
    description: str
    amount: float
    monthly_income: float
    declared_debts: float
    country: Country

    loan_purpose: str
