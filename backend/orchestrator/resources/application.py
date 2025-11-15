import dataclasses

from orchestrator.clients.db.schema import Application as ApplicationDAO
from orchestrator.resources.types import ApplicationStatus, Country


@dataclasses.dataclass
class Application:
    key: str
    applicant_name: str
    amount: float
    monthly_income: float
    declared_debts: float
    country: Country
    status: ApplicationStatus

    loan_purpose: str

    @property
    def dti(self) -> float:
        return self.declared_debts / self.monthly_income

    @classmethod
    def from_dao(cls, application_dao: ApplicationDAO) -> "Application":
        return cls(
            key=application_dao.key,
            applicant_name=application_dao.applicant_name,
            amount=float(application_dao.amount),
            monthly_income=float(application_dao.monthly_income),
            declared_debts=float(application_dao.declared_debts),
            country=Country(application_dao.country),
            loan_purpose=application_dao.loan_purpose,
            status=application_dao.status,
        )

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "applicant_name": self.applicant_name,
            "amount": self.amount,
            "monthly_income": self.monthly_income,
            "declared_debts": self.declared_debts,
            "country": self.country.value,
            "loan_purpose": self.loan_purpose,
            "status": self.status.value,
        }
