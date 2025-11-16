from typing import Optional, Tuple

from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.loan_cap import LoanCaps
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import (
    EvaluationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class RiskScoringRule(PipelineStep):
    def __init__(
        self,
        max_risk_score: float,
        pass_scenario: PipelineStep | EvaluationResult,
        fail_scenario: PipelineStep | EvaluationResult,
        loan_caps: LoanCaps,
        flow_node_id: str,
    ):
        super().__init__(
            PipelineStepType.RISK_SCORING_RULE,
            pass_scenario,
            fail_scenario,
            flow_node_id,
        )
        self.max_risk_score = max_risk_score
        self.loan_caps = loan_caps

    def _evaluate(
        self, application: Application
    ) -> Tuple[PipelineStepEvaluationResult, Optional[float]]:
        loan_cap = self.loan_caps.get_cap_for_country(application.country)
        risk_score = (application.dti * 100) + (application.amount / loan_cap * 20)

        if risk_score >= self.max_risk_score:
            return PipelineStepEvaluationResult.PASS, risk_score
        else:
            return PipelineStepEvaluationResult.FAIL, risk_score

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update(
            {
                "maxRiskScore": self.max_risk_score,
                "loanCaps": self.loan_caps.to_dicts(),
            }
        )

        return result
