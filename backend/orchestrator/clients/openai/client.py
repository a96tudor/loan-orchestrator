from enum import Enum
from typing import Optional

from openai import OpenAI

from orchestrator.utils.logging import logger

_SYSTEM_PROMPT = """
You classify short free-text messages in the context of a loan application.

Output rules:
- You MUST respond with exactly one of these two tokens: RISKY or NOT-RISKY.
- RISKY = clearly negative, aggressive, hostile, unstable, threatening, or
    otherwise concerning sentiment.
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
            max_output_tokens=3,
            temperature=0,
        )
        raw = response.choices[0].message.content.strip().upper()

        try:
            return OpenAIClassificationResult(raw)
        except Exception:
            logger.warning(f"OpenAI classification returned unexpected result: {raw}")
            return OpenAIClassificationResult.CLASSIFICATION_FAILED
