from cupid.errors import classify_exception
from cupid.prompts import build_analysis_prompt, build_chat_system_prompt
from cupid.config import normalize_base_url


class FakeExc(Exception):
    pass


class TestClassify:
    def _mk(self, name, status=None, msg=""):
        e = FakeExc(msg)
        e.__class__.__name__ = name
        if status is not None:
            e.status_code = status
        return e

    def test_invalid_key(self):
        assert classify_exception(self._mk("AuthenticationError", 401)) == "invalid_api_key"
        assert classify_exception(self._mk("ForbiddenError", 403)) == "invalid_api_key"

    def test_model_not_found(self):
        assert classify_exception(self._mk("NotFoundError", 404)) == "model_not_found"

    def test_rate_limit_vs_credits(self):
        assert classify_exception(self._mk("RateLimitError", 429, "too many requests")) == "rate_limited"
        assert classify_exception(self._mk("RateLimitError", 429, "insufficient_quota")) == "insufficient_credits"

    def test_vision_unsupported(self):
        assert classify_exception(self._mk("BadRequestError", 400, "image input not supported")) == "vision_unsupported"

    def test_json_unsupported(self):
        e = self._mk("BadRequestError", 400, "response_format is not supported")
        assert classify_exception(e) == "json_mode_unsupported"

    def test_timeout_and_network(self):
        assert classify_exception(self._mk("APITimeoutError")) == "timeout"
        assert classify_exception(self._mk("APIConnectionError")) == "network"

    def test_provider_5xx(self):
        assert classify_exception(self._mk("InternalServerError", 500)) == "provider_unavailable"
        assert classify_exception(self._mk("APIStatusError", 503, "service overloaded")) == "provider_unavailable"

    def test_402_credits(self):
        assert classify_exception(self._mk("PaymentRequiredError", 402, "not enough credits")) == "insufficient_credits"

    def test_unreadable_provider_body(self):
        assert classify_exception(self._mk("APIResponseValidationError")) == "invalid_provider_response"

    def test_server(self):
        assert classify_exception(self._mk("SomethingWeirdError")) == "server_error"


class TestBaseUrl:
    def test_strip_trailing_slash(self):
        assert normalize_base_url("https://x.example/v1/") == "https://x.example/v1"

    def test_strip_chat_completions(self):
        assert normalize_base_url("https://x.example/v1/chat/completions") == "https://x.example/v1"


class TestPrompts:
    def test_analysis_prompt_has_guards(self):
        p = build_analysis_prompt(
            my_interests=["เกม"],
            their_interests=["เกม", "แมว"],
            matched_interests=["เกม"],
            relationship={"status": "เพื่อนกัน"},
            interaction_notes="เขาอ่านไม่ตอบ 3 วัน",
            has_photos=False,
            photo_labels=[],
        )
        assert "<user_data>" in p and "</user_data>" in p
        assert "เกม" in p
        assert "score" in p

    def test_chat_system_prompt_modes_distinct(self):
        n = build_chat_system_prompt("normal", None)
        s = build_chat_system_prompt("savage", None)
        h = build_chat_system_prompt("heartbreak", None)
        assert "ให้กำลังใจ" in n
        assert "เสียดแทง" in s
        assert "มูฟออน" in h

    def test_chat_prompt_includes_context(self):
        ctx = {"score": 72, "verdict": "มีทรง", "summary": "สรุป", "sharedInterests": [{"topic": "เกม"}]}
        p = build_chat_system_prompt("savage", ctx)
        assert "72" in p and "เกม" in p
