import base64
import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("AI_PROVIDER_NAME", "TestProvider")
os.environ.setdefault("AI_API_BASE_URL", "https://fake.example/v1")
os.environ.setdefault("AI_API_KEY", "test-key-123")
os.environ.setdefault("AI_TEXT_MODEL", "test-text-model")
os.environ.setdefault("AI_VISION_MODEL", "test-vision-model")
os.environ.setdefault("RATE_LIMIT_ANALYZE_PER_HOUR", "100")

import pytest
from app import create_app

FAKE_REPORT_DICT = {
    "score": 72,
    "verdict": "มีทรงว่ะ ลุยเบา ๆ",
    "summary": "ข้อมูลดูดี แต่อย่าเพิ่งไปจองพิธี นี่คือคะแนนความบันเทิง",
    "shared_interests": [{"topic": "เกม", "note": "ชวนเล่นด้วยกัน"}],
    "conversation_starters": ["ข้อ 1", "ข้อ 2"],
    "flirting_tips": ["เทคนิค 1"],
    "next_step": "ชวนไปกินข้าว",
    "score_explanation": "มาจากสิ่งที่ชอบตรงกัน ไม่ได้มาจากหน้าตา",
    "confidence": "medium",
    "roast": "หัวใจมึงเล่นเกม single-player 💀",
}


@pytest.fixture()
def client(monkeypatch):
    app = create_app()
    app.testing = True
    with app.test_client() as c:
        yield c


@pytest.fixture()
def fake_provider(monkeypatch):
    calls = {"json": [], "text": []}

    def fake_json(cfg, messages, *, vision=False, max_tokens=1600, temperature=0.9, **kw):
        calls["json"].append({"vision": vision, "messages": messages})
        import json as _json

        return "```json\n" + _json.dumps(FAKE_REPORT_DICT, ensure_ascii=False) + "\n```"

    def fake_text(cfg, messages, *, vision=False, max_tokens=800, temperature=0.9, **kw):
        calls["text"].append({"vision": vision, "messages": messages})
        return "โอเคมึง กูได้ยินแล้ว"

    monkeypatch.setattr("cupid.provider.complete_json", fake_json)
    monkeypatch.setattr("cupid.provider.complete", fake_text)
    return calls


def make_png_data_url(color=(255, 0, 0), size=(64, 64)) -> str:
    from PIL import Image

    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"
