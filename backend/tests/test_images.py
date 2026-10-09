import base64
import io

import pytest
from PIL import Image

from cupid.errors import AppError
from cupid.images import decode_data_url, normalize_image, validate_and_normalize


def _png_bytes(color=(1, 2, 3), size=(32, 32)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _to_data_url(raw: bytes, mime: str = "image/png") -> str:
    return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")


class TestDecode:
    def test_valid_png(self):
        raw = _png_bytes()
        mime, out = decode_data_url(_to_data_url(raw), 8 * 1024 * 1024)
        assert mime == "image/png"
        assert out == raw

    def test_rejects_wrong_signature(self):
        fake = b"J" + b"\x00" * 100
        with pytest.raises(AppError) as e:
            decode_data_url(_to_data_url(fake), 8 * 1024 * 1024)
        assert e.value.code == "invalid_image"

    def test_rejects_wrong_mime(self):
        raw = _png_bytes()
        with pytest.raises(AppError):
            decode_data_url(_to_data_url(raw, "image/jpeg"), 8 * 1024 * 1024)

    def test_rejects_oversize(self):
        raw = _png_bytes(size=(2000, 2000))
        with pytest.raises(AppError) as e:
            decode_data_url(_to_data_url(raw), 1024)
        assert e.value.code == "image_too_large"

    def test_rejects_garbage(self):
        with pytest.raises(AppError):
            decode_data_url("data:image/png;base64,!!!not-base64!!!", 8 * 1024 * 1024)

    def test_rejects_non_string(self):
        with pytest.raises(AppError):
            decode_data_url(None, 8 * 1024 * 1024)


class TestNormalize:
    def test_reencode_jpeg_output(self):
        url = normalize_image(_png_bytes(color=(10, 200, 30)))
        assert url.startswith("data:image/jpeg;base64,")

    def test_rejects_decoy_text(self):
        fake = b"\x89PNG\r\n\x1a\n" + b"A" * 200
        with pytest.raises(AppError):
            normalize_image(fake)

    def test_full_pipeline(self):
        url = validate_and_normalize(_to_data_url(_png_bytes()), 8 * 1024 * 1024)
        assert url.startswith("data:image/jpeg;base64,")
