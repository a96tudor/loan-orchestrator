from typing import List, Optional
from uuid import uuid4

from pyutils.database.sqlalchemy.filters import EqualityFilter, InListFilter

from backend.src.clients.db.schema import Application
from backend.src.clients.db.wrappers.base import BaseDBWrapper
from backend.src.resources.types import ApplicationStatus, Country
from backend.src.utils.logging import log_execution_time


class ApplicationsDBWrapper(BaseDBWrapper):
    def __init__(self):
        super().__init__(Application)

    @log_execution_time(description="Creating a new Application in the database")
    def create_application(
        self,
        applicant_name: str,
        amount: float,
        monthly_income: float,
        declared_debts: float,
        country: Country,
        loan_purpose: str,
    ) -> Application:
        app_id = str(uuid4())
        return self._create_and_upsert(
            id=app_id,
            applicant_name=applicant_name,
            amount=amount,
            monthly_income=monthly_income,
            declared_debts=declared_debts,
            country=country.value,
            loan_purpose=loan_purpose,
            status=ApplicationStatus.SUBMITTED,
        )

    @log_execution_time(description="Fetching Applications by value from the database")
    def get_applications_by_value(
        self,
        key: Optional[str],
        status_in: Optional[List[ApplicationStatus]] = None,
        status_not_in: Optional[List[ApplicationStatus]] = None,
    ):
        filters = []
        if key:
            filters.append(EqualityFilter(Application.key, key))
        if status_in:
            filters.append(InListFilter(Application.status, status_in))
        if status_not_in:
            filters.append(
                InListFilter(Application.status, status_not_in, negated=True)
            )

        return self._get_model(
            filters=filters,
            return_type=self.GetResultType.ALL,
        )
