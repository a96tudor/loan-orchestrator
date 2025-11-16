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


class EvaluationResult(Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class PipelineStatus(Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class PipelineStepEvaluationResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class PipelineStepType(Enum):
    DTI_RULE = "DTI_RULE"
    AMOUNT_POLICY_RULE = "AMOUNT_POLICY_RULE"
    RISK_SCORING_RULE = "RISK_SCORING_RULE"
    SENTIMENT_ANALYSIS_RULE = "SENTIMENT_ANALYSIS_RULE"


Country = Enum(
    "Country",
    {country.name: country.name for country in pycountry.countries},
)
