import json

from conftest import FAKE_REPORT_DICT, make_png_data_url


class TestMeta:
    def test_config(self, client):
        res = client.get("/api/config")
        assert res.status_code == 200
        body = res.get_json()
        assert body["configured"] is True
        assert body["models"]["text"] == "test-text-model"
        assert "test-key" not in res.get_data(as_text=True)

    def test_health(self, client):
        assert client.get("/api/health").get_json()["ok"] is True

    def test_test_connection_ok(self, client, fake_provider):
        res = client.post("/api/test-connection")
        body = res.get_json()
        assert res.status_code == 200
        assert body["ok"] is True
        assert "latencyMs" in body


class TestAnalyze:
    def test_text_only(self, client, fake_provider):
        res = client.post(
            "/api/analyze",
            json={"myInterests": ["เกม", "แมว"], "theirInterests": ["เกม"], "interactionNotes": "เขาทักก่อน"},
        )
        assert res.status_code == 200
        report = res.get_json()["report"]
        assert report["score"] == FAKE_REPORT_DICT["score"]
        assert res.get_json()["meta"]["usedVision"] is False

    def test_vision_used_when_photo(self, client, fake_provider):
        res = client.post(
            "/api/analyze",
            json={"userPhoto": make_png_data_url(), "myInterests": ["เกม"]},
        )
        assert res.status_code == 200
        assert res.get_json()["meta"]["usedVision"] is True
        assert fake_provider["json"], "provider must be called"
        user_msg = fake_provider["json"][0]["messages"][-1]["content"]
        assert isinstance(user_msg, list), "vision content must be multimodal"

    def test_not_enough_input(self, client, fake_provider):
        res = client.post("/api/analyze", json={})
        assert res.status_code == 400
        assert res.get_json()["error"]["code"] == "not_enough_input"

    def test_invalid_image(self, client, fake_provider):
        import base64

        fake = "data:image/png;base64," + base64.b64encode(b"notapng" + b"\x00" * 90).decode()
        res = client.post("/api/analyze", json={"userPhoto": fake, "myInterests": ["เกม"]})
        assert res.status_code == 400
        assert res.get_json()["error"]["code"] == "invalid_image"

    def test_not_configured(self, monkeypatch, fake_provider):
        import app as app_module
        from cupid.config import AppConfig

        def _unconfigured():
            return AppConfig(
                provider_name="x", base_url="", api_key="", vision_model="", text_model="",
                timeout=10, max_retries=0, json_mode="off", sad_music_youtube_id="",
                frontend_origins=("http://localhost:5173",), max_image_bytes=8 * 1024 * 1024,
                analyze_per_hour=100, chat_per_10min=100, test_per_min=100,
            )

        monkeypatch.setattr(app_module, "load_config", _unconfigured)
        app = app_module.create_app()
        app.testing = True
        with app.test_client() as c:
            res = c.post("/api/analyze", json={"myInterests": ["เกม"]})
            assert res.status_code == 503
            assert res.get_json()["error"]["code"] == "not_configured"

    def test_error_mapped_to_thai(self, client, fake_provider, monkeypatch):
        from cupid.errors import AppError

        def boom(cfg, messages, **kw):
            raise AppError("model_not_found")

        monkeypatch.setattr("cupid.provider.complete_json", boom)
        res = client.post("/api/analyze", json={"myInterests": ["เกม"]})
        assert res.status_code == 502
        msg = res.get_json()["error"]["message"]
        assert "โมเดล" in msg


class TestChat:
    def test_chat_ok(self, client, fake_provider):
        res = client.post(
            "/api/chat",
            json={
                "mode": "savage",
                "messages": [{"role": "user", "content": "กูมีโอกาสไหม?"}],
                "reportContext": {"score": 72, "sharedInterests": [{"topic": "เกม"}]},
            },
        )
        assert res.status_code == 200
        assert res.get_json()["reply"] == "โอเคมึง กูได้ยินแล้ว"

    def test_chat_requires_user_last(self, client, fake_provider):
        res = client.post("/api/chat", json={"messages": []})
        assert res.status_code == 400

    def test_chat_rate_limited(self, monkeypatch, fake_provider):
        import os

        monkeypatch.setenv("RATE_LIMIT_CHAT_PER_10MIN", "1")
        app = __import__("app").create_app()
        app.testing = True
        with app.test_client() as c:
            payload = {"messages": [{"role": "user", "content": "hi"}]}
            assert c.post("/api/chat", json=payload).status_code == 200
            res = c.post("/api/chat", json=payload)
            assert res.status_code == 429
            assert res.get_json()["error"]["code"] == "rate_limited"
