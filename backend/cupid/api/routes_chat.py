from flask import Blueprint, request

from cupid import provider
from cupid.config import AppConfig
from cupid.errors import AppError
from cupid.prompts import build_chat_system_prompt
from cupid.ratelimit import Limiters

MAX_MESSAGES = 16
MAX_MSG_LEN = 2000
MAX_TOKENS = 900


def _sanitize_messages(messages) -> list:
    if not isinstance(messages, list):
        return []
    out = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        role = m.get("role")
        content = m.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            continue
        content = content.strip()[:MAX_MSG_LEN]
        if content:
            out.append({"role": role, "content": content})
    return out[-MAX_MESSAGES:]


def _sanitize_context(ctx) -> dict:
    if not isinstance(ctx, dict):
        return {}
    score = ctx.get("score")
    try:
        score = int(score) if score is not None else None
    except (TypeError, ValueError):
        score = None
    interests = ctx.get("sharedInterests") or []
    topics = []
    for i in interests[:10]:
        if isinstance(i, dict):
            t = str(i.get("topic", "")).strip()[:80]
        else:
            t = str(i or "").strip()[:80]
        if t:
            topics.append(t)
    return {
        "score": score,
        "verdict": str(ctx.get("verdict", "") or "")[:300],
        "summary": str(ctx.get("summary", "") or "")[:600],
        "sharedInterests": topics,
    }


def register(bp: Blueprint, cfg: AppConfig, limiters: Limiters) -> None:
    @bp.post("/api/chat")
    def chat():
        if not cfg.configured:
            raise AppError("not_configured", 503)
        if not limiters.chat.allow(_client_ip()):
            raise AppError("rate_limited", 429)

        payload = request.get_json(silent=True) or {}
        mode = payload.get("mode")
        if mode not in ("normal", "savage", "heartbreak"):
            mode = "normal"
        messages = _sanitize_messages(payload.get("messages"))
        if not messages or messages[-1]["role"] != "user":
            raise AppError("bad_request", 400)
        context = _sanitize_context(payload.get("reportContext"))

        system = build_chat_system_prompt(mode, context or None)
        full = [{"role": "system", "content": system}, *messages]
        reply = provider.complete(cfg, full, vision=False, max_tokens=MAX_TOKENS, temperature=0.95)
        if not reply:
            raise AppError("invalid_ai_output", 502)
        return {"reply": reply}, 200


def _client_ip() -> str:
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "unknown"
