import os
from dataclasses import dataclass

SAD_MUSIC_FALLBACK_URL = "https://www.youtube.com/results?search_query=%E0%B9%80%E0%B8%9E%E0%B8%A5%E0%B8%87%E0%B9%80%E0%B8%A8%E0%B8%A3%E0%B9%89%E0%B8%B2"


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _get_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def normalize_base_url(url: str) -> str:
    url = (url or "").strip().rstrip("/")
    if url.endswith("/chat/completions"):
        url = url[: -len("/chat/completions")]
    return url


@dataclass(frozen=True)
class AppConfig:
    provider_name: str
    base_url: str
    api_key: str
    vision_model: str
    text_model: str
    timeout: float
    max_retries: int
    json_mode: str
    sad_music_youtube_id: str
    frontend_origins: tuple
    max_image_bytes: int
    analyze_per_hour: int
    chat_per_10min: int
    test_per_min: int

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.text_model)

    @property
    def vision_configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.vision_model)


def load_config() -> AppConfig:
    json_mode = (os.getenv("AI_JSON_MODE", "auto") or "auto").strip().lower()
    if json_mode not in ("auto", "on", "off"):
        json_mode = "auto"
    origins_raw = os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    )
    origins = tuple(o.strip() for o in origins_raw.split(",") if o.strip())
    return AppConfig(
        provider_name=os.getenv("AI_PROVIDER_NAME", "Custom Provider").strip() or "Custom Provider",
        base_url=normalize_base_url(os.getenv("AI_API_BASE_URL", "")),
        api_key=os.getenv("AI_API_KEY", "").strip(),
        vision_model=os.getenv("AI_VISION_MODEL", "").strip(),
        text_model=os.getenv("AI_TEXT_MODEL", "").strip(),
        timeout=_get_float("AI_REQUEST_TIMEOUT", 90.0),
        max_retries=_get_int("AI_MAX_RETRIES", 1),
        json_mode=json_mode,
        sad_music_youtube_id=os.getenv("SAD_MUSIC_YOUTUBE_ID", "").strip(),
        frontend_origins=origins,
        max_image_bytes=_get_int("MAX_IMAGE_MB", 8) * 1024 * 1024,
        analyze_per_hour=_get_int("RATE_LIMIT_ANALYZE_PER_HOUR", 8),
        chat_per_10min=_get_int("RATE_LIMIT_CHAT_PER_10MIN", 40),
        test_per_min=_get_int("RATE_LIMIT_TEST_PER_MIN", 5),
    )
