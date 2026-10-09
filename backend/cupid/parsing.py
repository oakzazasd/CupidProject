import json
import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from cupid.errors import AppError


class InterestItem(BaseModel):
    topic: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=400)


class CompatibilityReport(BaseModel):
    score: int = Field(ge=0, le=100)
    verdict: str = ""
    summary: str = ""
    shared_interests: list[InterestItem] = Field(default_factory=list)
    conversation_starters: list[str] = Field(default_factory=list)
    flirting_tips: list[str] = Field(default_factory=list)
    next_step: str = ""
    score_explanation: str = ""
    confidence: Literal["low", "medium", "high"] = "low"
    roast: str = ""

    @field_validator("score", mode="before")
    @classmethod
    def _clamp_score(cls, v: Any) -> int:
        try:
            n = int(round(float(v)))
        except (TypeError, ValueError):
            raise AppError("invalid_ai_output", 502)
        return max(0, min(100, n))

    @field_validator("confidence", mode="before")
    @classmethod
    def _norm_confidence(cls, v: Any) -> str:
        s = str(v or "").lower().strip()
        if s in ("medium", "med", "กลาง"):
            return "medium"
        if s in ("high", "hi", "สูง"):
            return "high"
        return "low"

    @field_validator(
        "verdict", "summary", "next_step", "score_explanation", "roast", mode="before"
    )
    @classmethod
    def _clean_str(cls, v: Any) -> str:
        return str(v or "").strip()[:1200]

    @field_validator("conversation_starters", "flirting_tips", mode="before")
    @classmethod
    def _clean_list(cls, v: Any) -> list:
        if not isinstance(v, list):
            return []
        return [str(x).strip()[:400] for x in v if x is not None and str(x).strip()][:8]

    @field_validator("shared_interests", mode="before")
    @classmethod
    def _clean_interests(cls, v: Any) -> list:
        if not isinstance(v, list):
            return []
        out = []
        for x in v[:12]:
            if isinstance(x, dict):
                topic = str(x.get("topic", "")).strip()[:120]
                note = str(x.get("note", "")).strip()[:400]
                if topic:
                    out.append({"topic": topic, "note": note})
            elif isinstance(x, str) and x.strip():
                out.append({"topic": x.strip()[:120], "note": ""})
        return out


_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


def extract_json_object(text: str) -> dict:
    if not text or not text.strip():
        raise AppError("invalid_ai_output", 502)
    candidates: list[str] = []
    fenced = _FENCE_RE.findall(text)
    candidates.extend(fenced)
    candidates.append(text)
    for cand in candidates:
        start = cand.find("{")
        end = cand.rfind("}")
        if start == -1 or end <= start:
            continue
        snippet = cand[start : end + 1]
        try:
            parsed = json.loads(snippet)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            continue
    raise AppError("invalid_ai_output", 502)


def parse_report(raw_text: str) -> CompatibilityReport:
    data = extract_json_object(raw_text)
    if "score" not in data:
        raise AppError("invalid_ai_output", 502)
    try:
        return CompatibilityReport.model_validate(data)
    except AppError:
        raise
    except Exception:
        raise AppError("invalid_ai_output", 502)
