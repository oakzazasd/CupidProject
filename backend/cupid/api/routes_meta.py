import time

from flask import Blueprint, jsonify

from cupid import provider
from cupid.config import AppConfig, SAD_MUSIC_FALLBACK_URL
from cupid.ratelimit import Limiters


def register(bp: Blueprint, cfg: AppConfig, limiters: Limiters) -> None:
    @bp.get("/api/config")
    def get_config():
        return jsonify(
            {
                "configured": cfg.configured,
                "visionConfigured": cfg.vision_configured,
                "provider": {
                    "name": cfg.provider_name,
                    "baseUrl": cfg.base_url,
                },
                "models": {
                    "vision": cfg.vision_model or None,
                    "text": cfg.text_model or None,
                },
                "sadMusic": {
                    "youtubeId": cfg.sad_music_youtube_id or None,
                    "fallbackUrl": SAD_MUSIC_FALLBACK_URL,
                },
            }
        )

    @bp.post("/api/test-connection")
    def test_connection():
        if not cfg.configured:
            return jsonify(
                {
                    "ok": False,
                    "code": "not_configured",
                    "message": "ยังไม่ได้ตั้งค่า AI Provider ให้แอดมินเติม AI_API_BASE_URL, AI_API_KEY และ AI_TEXT_MODEL ในไฟล์ .env ก่อน",
                }
            )
        if not limiters.test.allow(_client_ip()):
            from cupid.errors import AppError

            e = AppError("rate_limited", 429)
            return jsonify({"ok": False, "code": e.code, "message": e.message})
        started = time.perf_counter()
        try:
            reply = provider.complete(
                cfg,
                [{"role": "user", "content": "ตอบสั้น ๆ: ping"}],
                vision=False,
                max_tokens=64,
                temperature=0.0,
            )
            latency = int((time.perf_counter() - started) * 1000)
            ok = bool(reply)
            return jsonify(
                {
                    "ok": ok,
                    "latencyMs": latency,
                    "message": "เชื่อมต่อสำเร็จ Cupid AI พร้อมทำงาน 💘"
                    if ok
                    else "เชื่อมต่อได้ แต่โมเดลตอบกลับมาว่างเปล่า (ถ้าเป็นโมเดลแบบ reasoning ให้แอดมินลองเปลี่ยน AI_TEXT_MODEL เป็นโมเดลสนทนาทั่วไป)",
                }
            )
        except Exception as exc:
            from cupid.errors import AppError, THAI_MESSAGES, classify_exception

            code = exc.code if isinstance(exc, AppError) else classify_exception(exc)
            return jsonify({"ok": False, "code": code, "message": THAI_MESSAGES.get(code, THAI_MESSAGES["server_error"])})

    @bp.get("/api/health")
    def health():
        return jsonify({"ok": True, "service": "cupid-ai"})


def _client_ip() -> str:
    from flask import request

    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "unknown"
