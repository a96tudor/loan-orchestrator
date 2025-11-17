import os
from enum import Enum
from typing import Optional

from openai import OpenAI

from orchestrator.utils.logging import logger

_SYSTEM_PROMPT = """
You classify short free-text messages in the context of a loan application.
The text represents the applicant's stated purpose for the loan.

Output rules:
- You MUST respond with exactly one of these two tokens: RISKY or NOT-RISKY.
- RISKY = clearly negative, aggressive, hostile, unstable, threatening, or
    otherwise concerning sentiment, serious risk of not being able to repay the loan.
- NOT-RISKY = neutral or positive sentiment, or benign small complaints.

No explanations, no punctuation, no extra words. Only: RISKY or NOT-RISKY.
"""


class OpenAIClassificationResult(Enum):
    RISKY = "RISKY"
    NOT_RISKY = "NOT-RISKY"
    CLASSIFICATION_FAILED = "CLASSIFICATION_FAILED"


class AvailableOpenAIModels(Enum):
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_41_MINI = "gpt-4.1-mini"


class OpenAIClient:
    def __init__(self):
        print(os.environ.get("OPENAI_API_KEY"))
        self.client = OpenAI()

    def classify_risk(
        self,
        text: str,
        model: Optional[AvailableOpenAIModels] = AvailableOpenAIModels.GPT_4O_MINI,
    ) -> OpenAIClassificationResult:
        response = self.client.responses.create(
            model=str(model.value),
            input=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            max_output_tokens=16,
            temperature=0,
        )
        raw = response.output[0].content[0].text.strip().upper()

        if "NOT-RISKY" in raw:
            return OpenAIClassificationResult.NOT_RISKY
        elif "RISKY" in raw:
            return OpenAIClassificationResult.RISKY
        else:
            return OpenAIClassificationResult.CLASSIFICATION_FAILED
