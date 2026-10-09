from flask import Blueprint, request

from cupid import provider
from cupid.config import AppConfig
from cupid.errors import AppError
from cupid.images import validate_and_normalize
from cupid.parsing import parse_report
from cupid.prompts import BASE_PERSONALITY, build_analysis_prompt
from cupid.ratelimit import Limiters

MAX_LIST_ITEMS = 24
MAX_STR = 60
MAX_NOTES = 1500


def _clean_list(items, limit: int = MAX_LIST_ITEMS, maxlen: int = MAX_STR) -> list:
    if not isinstance(items, list):
        return []
    seen = []
    for x in items[: limit * 2]:
        s = str(x or "").strip()[:maxlen]
        if s and s not in seen:
            seen.append(s)
        if len(seen) >= limit:
            break
    return seen


def _clean_str(v, maxlen: int = 600) -> str:
    if not isinstance(v, str):
        return ""
    return v.strip()[:maxlen]


def client_ip() -> str:
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "unknown"


def register(bp: Blueprint, cfg: AppConfig, limiters: Limiters) -> None:
    @bp.post("/api/analyze")
    def analyze():
        if not cfg.configured:
            raise AppError("not_configured", 503)
        if not limiters.analyze.allow(client_ip()):
            raise AppError("rate_limited", 429)

        payload = request.get_json(silent=True) or {}

        my_interests = _clean_list(payload.get("myInterests"))
        their_interests = _clean_list(payload.get("theirInterests"))
        matched = _clean_list(payload.get("matchedInterests"))
        if not matched:
            matched = _clean_list(list(set(my_interests) & set(their_interests)))
        rel_raw = payload.get("relationship") or {}
        relationship = {k: _clean_str(v) for k, v in rel_raw.items()} if isinstance(rel_raw, dict) else {}
        notes = _clean_str(payload.get("interactionNotes"), MAX_NOTES)

        raw_photos = []
        photo_labels = []
        if isinstance(payload.get("userPhoto"), str) and payload["userPhoto"].startswith("data:image"):
            raw_photos.append(("รูปของผู้ใช้", payload["userPhoto"]))
            photo_labels.append("รูปของผู้ใช้")
        if isinstance(payload.get("crushPhoto"), str) and payload["crushPhoto"].startswith("data:image"):
            raw_photos.append(("รูปของคนที่ผู้ใช้ชอบ", payload["crushPhoto"]))
            photo_labels.append("รูปของคนที่ผู้ใช้ชอบ")

        if not raw_photos and not my_interests and not their_interests and not notes:
            raise AppError("not_enough_input", 400)

        if raw_photos and not cfg.vision_configured:
            raise AppError("vision_not_configured", 400)

        images: list = []
        try:
            for label, data_url in raw_photos:
                images.append(validate_and_normalize(data_url, cfg.max_image_bytes))

            prompt = build_analysis_prompt(
                my_interests=my_interests,
                their_interests=their_interests,
                matched_interests=matched,
                relationship=relationship,
                interaction_notes=notes,
                has_photos=bool(images),
                photo_labels=photo_labels,
            )
            if images:
                user_content = provider.build_vision_user_content(prompt, images)
                messages = [
                    {"role": "system", "content": BASE_PERSONALITY},
                    {"role": "user", "content": user_content},
                ]
                raw_text = provider.complete_json(cfg, messages, vision=True, max_tokens=2000)
            else:
                messages = [
                    {"role": "system", "content": BASE_PERSONALITY},
                    {"role": "user", "content": prompt},
                ]
                raw_text = provider.complete_json(cfg, messages, vision=False, max_tokens=2000)
            report = parse_report(raw_text)
            return {"report": report.model_dump(), "meta": {"usedVision": bool(images)}}, 200
        finally:
            images = None
            raw_photos = None
