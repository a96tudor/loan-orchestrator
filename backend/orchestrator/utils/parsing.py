from typing import Dict, List, Union

from pyutils.helpers.errors import Error

from orchestrator.clients.openai.client import AvailableOpenAIModels
from orchestrator.resources.pipeline.amount_policy import AmountPoliciesRule
from orchestrator.resources.pipeline.dti_rule import DTIRule
from orchestrator.resources.pipeline.loan_cap import LoanCapForCountry, LoanCaps
from orchestrator.resources.pipeline.risk_scoring import RiskScoringRule
from orchestrator.resources.pipeline.sentiment_analysis import SentimentAnalysisStep
from orchestrator.resources.pipeline.step import PipelineStep
from orchestrator.resources.types import Country, EvaluationResult, PipelineStepType
from orchestrator.utils.logging import logger


class ParsingError(Error):
    _extension_details = {
        "category": "server",
        "code": "ParsingError",
        "severity": "error",
    }

    def __init__(self, message: str):
        super().__init__(message)


def _parse_loan_caps(caps: List[Dict]) -> LoanCaps:
    loan_caps = []
    other_cap = None
    for raw_cap in caps:
        if raw_cap["country"] == "OTHER":
            other_cap = raw_cap["capAmount"]
            continue

        loan_caps.append(
            LoanCapForCountry(
                country=Country(raw_cap["country"]),
                cap_amount=raw_cap["capAmount"],
            )
        )

    if other_cap is None:
        raise ParsingError("Loan caps must include an 'OTHER' country cap.")

    return LoanCaps(caps=loan_caps, other=other_cap)


def _parse_amount_policies_rule(step_dict: dict) -> AmountPoliciesRule:
    loan_caps = _parse_loan_caps(step_dict.get("loanCaps", []))

    fail_scenario = parse_pipeline_step(step_dict.get("failScenario"))
    pass_scenario = parse_pipeline_step(step_dict.get("passScenario"))

    return AmountPoliciesRule(
        loan_caps=loan_caps,
        pass_scenario=pass_scenario,
        fail_scenario=fail_scenario,
        flow_node_id=step_dict.get("nodeId"),
    )


def _parse_risk_scoring_rule(step_dict: dict) -> RiskScoringRule:
    loan_caps = _parse_loan_caps(step_dict.get("loanCaps", []))
    max_risk_score = step_dict.get("maxRiskScore")
    if max_risk_score is None:
        raise ParsingError("Risk Scoring Rule must include 'maxRiskScore' field.")

    fail_scenario = parse_pipeline_step(step_dict.get("failScenario"))
    pass_scenario = parse_pipeline_step(step_dict.get("passScenario"))

    return RiskScoringRule(
        max_risk_score=max_risk_score,
        loan_caps=loan_caps,
        pass_scenario=pass_scenario,
        fail_scenario=fail_scenario,
        flow_node_id=step_dict.get("nodeId"),
    )


def _parse_dti_rule(step_dict: dict) -> DTIRule:
    max_dti = step_dict.get("maxDTI")

    if max_dti is None:
        raise ParsingError("DTI Rule must include 'maxDTI' field.")

    fail_scenario = parse_pipeline_step(step_dict.get("failScenario"))
    pass_scenario = parse_pipeline_step(step_dict.get("passScenario"))

    return DTIRule(
        max_dti=max_dti,
        pass_scenario=pass_scenario,
        fail_scenario=fail_scenario,
        flow_node_id=step_dict.get("nodeId"),
    )


def parse_sentiment_analysis_step(step_dict: dict) -> SentimentAnalysisStep:
    fail_scenario = parse_pipeline_step(step_dict.get("failScenario"))
    pass_scenario = parse_pipeline_step(step_dict.get("passScenario"))

    model = (
        AvailableOpenAIModels(step_dict.get("model"))
        if step_dict.get("model")
        else AvailableOpenAIModels.GPT_4O_MINI
    )

    return SentimentAnalysisStep(
        pass_scenario=pass_scenario,
        fail_scenario=fail_scenario,
        flow_node_id=step_dict.get("nodeId"),
        model=model,
    )


PARSING_FUNCTIONS = {
    PipelineStepType.DTI_RULE.value: _parse_dti_rule,
    PipelineStepType.RISK_SCORING_RULE.value: _parse_risk_scoring_rule,
    PipelineStepType.AMOUNT_POLICY_RULE.value: _parse_amount_policies_rule,
    PipelineStepType.SENTIMENT_ANALYSIS_RULE.value: parse_sentiment_analysis_step,
}


def parse_pipeline_step(
    steps: Union[Dict, str],
) -> Union[PipelineStep, EvaluationResult]:
    logger.info(f"Parsing pipeline step: {steps}")
    if isinstance(steps, dict):
        step_type = steps.get("type")
        parse_func = PARSING_FUNCTIONS.get(step_type)

        if parse_func:
            return parse_func(steps)
        else:
            raise ParsingError(f"Unknown pipeline step type: {step_type}")
    elif isinstance(steps, str):
        try:
            return EvaluationResult(steps)
        except ValueError:
            raise ParsingError(f"Unknown evaluation result: {steps}")
    else:
        raise ParsingError("Invalid pipeline step format.")


def validate_pipeline_dict(pipeline_dict: dict) -> bool:
    try:
        parse_pipeline_step(pipeline_dict)
        return True
    except ParsingError as e:
        logger.error(f"Pipeline validation failed: {e}")
        return False
