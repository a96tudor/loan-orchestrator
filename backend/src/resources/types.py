from enum import Enum

import pycountry


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


class Country(Enum):
    pass


for country in pycountry.countries:
    setattr(Country, country.name, country.name)
