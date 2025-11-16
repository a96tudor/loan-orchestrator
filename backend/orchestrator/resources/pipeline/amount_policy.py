from typing import Optional, Tuple

from orchestrator.resources.application import Application
from orchestrator.resources.pipeline.loan_cap import LoanCaps
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import (
    EvaluationResult,
    PipelineStepEvaluationResult,
    PipelineStepType,
)


class AmountPoliciesRule(PipelineStep):
    def __init__(
        self,
        loan_caps: LoanCaps,
        pass_scenario: PipelineStep | EvaluationResult,
        fail_scenario: PipelineStep | EvaluationResult,
        flow_node_id: str,
    ):
        super().__init__(
            PipelineStepType.AMOUNT_POLICY_RULE,
            pass_scenario,
            fail_scenario,
            flow_node_id,
        )
        self.loan_caps = loan_caps

    def _evaluate(
        self, application: Application
    ) -> Tuple[PipelineStepEvaluationResult, Optional[float]]:
        cap_amount = self.loan_caps.get_cap_for_country(application.country)

        if application.amount <= cap_amount:
            return PipelineStepEvaluationResult.PASS, cap_amount
        else:
            return PipelineStepEvaluationResult.FAIL, cap_amount

    def to_dict(self) -> dict:
        result = super().to_dict()
        result.update({"loanCaps": self.loan_caps.to_dicts()})

        return result
