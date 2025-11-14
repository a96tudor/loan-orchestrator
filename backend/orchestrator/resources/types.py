from enum import Enum

import pycountry


class ApplicationEvaluationStatus(Enum):
    PENDING = "PENDING"
    EVALUATING = "EVALUATING"
    EVALUATED = "EVALUATED"
    EVALUATING_ERROR = "EVALUATING_ERROR"


class ApplicationStatus(Enum):
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    REVIEWED = "REVIEWED"
    REVIEWING_ERROR = "REVIEWING_ERROR"


class LoanApplicationResult(Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class PipelineStatus(Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    OLD_VERSION = "OLD_VERSION"


class PipelineStepEvaluationResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class PipelineStepType(Enum):
    DTI_RULE = "DTI_RULE"
    AMOUNT_POLICY_RULE = "AMOUNT_POLICY_RULE"
    RISK_SCORING_RULE = "RISK_SCORING_RULE"


class Country(Enum):
    pass


for country in pycountry.countries:
    setattr(Country, country.name, country.name)
