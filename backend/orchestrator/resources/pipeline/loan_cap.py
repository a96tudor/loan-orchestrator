import dataclasses

from orchestrator.resources.types import Country


@dataclasses.dataclass
class LoanCapForCountry:
    country: Country
    cap_amount: float

    def is_applicable_to(self, application_country: Country) -> bool:
        return self.country == application_country

    def to_dict(self):
        return {
            "country": self.country.value,
            "cap_amount": self.cap_amount,
        }


class LoanCaps(list):
    def __init__(self, caps: list[LoanCapForCountry], other: float):
        super().__init__(caps)
        self.other = other

    def get_cap_for_country(self, country: Country) -> float:
        for cap in self:
            if cap.is_applicable_to(country):
                return cap.cap_amount
        return self.other

    def to_dicts(self) -> list[dict]:
        result = [cap.to_dict() for cap in self]
        result.append({"country": "OTHER", "cap_amount": self.other})

        return result
