from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.loan_cap import LoanCaps
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import (
    LoanApplicationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class RiskScoringRule(PipelineStep):
    def __init__(
        self,
        max_risk_score: float,
        pass_scenario: PipelineStep | LoanApplicationResult,
        fail_scenario: PipelineStep | LoanApplicationResult,
        loan_caps: LoanCaps,
    ):
        super().__init__(
            PipelineStepType.RISK_SCORING_RULE, pass_scenario, fail_scenario
        )
        self.max_risk_score = max_risk_score
        self.loan_caps = loan_caps

    def _evaluate(self, application: Application) -> PipelineStepEvaluationResult:
        loan_cap = self.loan_caps.get_cap_for_country(application.country)
        risk_score = (application.dti * 100) + (application.amount / loan_cap * 20)

        if risk_score >= self.max_risk_score:
            return PipelineStepEvaluationResult.PASS
        else:
            return PipelineStepEvaluationResult.FAIL

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update(
            {
                "maxRiskScore": self.max_risk_score,
                "loanCaps": self.loan_caps.to_dicts(),
            }
        )

        return result
