import json

import pytest

from cupid.errors import AppError
from cupid.parsing import extract_json_object, parse_report

VALID = {
    "score": 78,
    "verdict": "มีทรงว่ะ ลุยเบา ๆ",
    "summary": "ดูดี แต่ใจเย็น",
    "shared_interests": [{"topic": "อนิเมะ", "note": "ดูด้วยกัน"}],
    "conversation_starters": ["สวัสดี", "หวัดดี"],
    "flirting_tips": ["ทักเรื่องที่ชอบ"],
    "next_step": "ชวนกินข้าว",
    "score_explanation": "จากสิ่งที่ชอบตรงกัน",
    "confidence": "medium",
    "roast": "โดนเลือกเป็นเพื่อน 💀",
}


class TestExtract:
    def test_plain_json(self):
        assert extract_json_object(json.dumps(VALID))["score"] == 78

    def test_fenced_json(self):
        text = "```json\n" + json.dumps(VALID) + "\n```"
        assert extract_json_object(text)["score"] == 78

    def test_json_with_chatter(self):
        text = "ผลวิเคราะห์นะครับ\n" + json.dumps(VALID) + "\nขอบคุณครับ"
        assert extract_json_object(text)["score"] == 78

    def test_invalid(self):
        with pytest.raises(AppError) as e:
            extract_json_object("ไม่มี json เลย")
        assert e.value.code == "invalid_ai_output"

    def test_empty(self):
        with pytest.raises(AppError):
            extract_json_object("")


class TestParseReport:
    def test_full_valid(self):
        r = parse_report(json.dumps(VALID))
        assert r.score == 78
        assert r.confidence == "medium"
        assert r.shared_interests[0].topic == "อนิเมะ"

    def test_score_clamped_high(self):
        d = dict(VALID, score=250)
        assert parse_report(json.dumps(d)).score == 100

    def test_score_clamped_low(self):
        d = dict(VALID, score=-5)
        assert parse_report(json.dumps(d)).score == 0

    def test_missing_score_rejected(self):
        d = {k: v for k, v in VALID.items() if k != "score"}
        with pytest.raises(AppError) as e:
            parse_report(json.dumps(d))
        assert e.value.code == "invalid_ai_output"

    def test_defaults_and_cleanup(self):
        minimal = {"score": 50, "conversation_starters": ["โอเค", "", None, "บาย"], "confidence": "weird"}
        r = parse_report(json.dumps(minimal))
        assert r.confidence == "low"
        assert r.conversation_starters == ["โอเค", "บาย"]
        assert r.shared_interests == []

    def test_truncated_lists(self):
        d = dict(VALID, conversation_starters=[f"ข้อความ {i}" for i in range(50)])
        assert len(parse_report(json.dumps(d)).conversation_starters) == 8

    def test_garbage_rejected(self):
        with pytest.raises(AppError):
            parse_report("<html>error</html>")
