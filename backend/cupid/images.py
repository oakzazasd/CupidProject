import base64
import io
import re

from PIL import Image

from cupid.errors import AppError

ALLOWED_MIME = ("image/jpeg", "image/png", "image/webp")

_DATA_URL_RE = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$")

MAX_DIMENSION = 1280
JPEG_QUALITY = 85


def decode_data_url(data_url: str, max_bytes: int) -> tuple[str, bytes]:
    if not isinstance(data_url, str):
        raise AppError("invalid_image", 400)
    m = _DATA_URL_RE.match(data_url.strip())
    if not m:
        raise AppError("invalid_image", 400)
    mime, b64 = m.group(1), m.group(2)
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raise AppError("invalid_image", 400)
    if len(raw) > max_bytes:
        raise AppError("image_too_large", 413)
    _check_magic(mime, raw)
    return mime, raw


def _check_magic(mime: str, raw: bytes) -> None:
    ok = False
    if mime == "image/jpeg":
        ok = raw[:3] == b"\xff\xd8\xff"
    elif mime == "image/png":
        ok = raw[:8] == b"\x89PNG\r\n\x1a\n"
    elif mime == "image/webp":
        ok = raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    if not ok or len(raw) < 64:
        raise AppError("invalid_image", 400)


def normalize_image(raw: bytes) -> str:
    """Safely decode and re-encode image in memory. Never touches disk."""
    try:
        with Image.open(io.BytesIO(raw)) as img:
            img.verify()
        with Image.open(io.BytesIO(raw)) as img:
            img.load()
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=JPEG_QUALITY)
            data = buf.getvalue()
    except AppError:
        raise
    except Exception:
        raise AppError("invalid_image", 400)
    finally:
        raw = None
    return "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")


def validate_and_normalize(data_url: str, max_bytes: int) -> str:
    _, raw = decode_data_url(data_url, max_bytes)
    return normalize_image(raw)
