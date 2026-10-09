THAI_MESSAGES = {
    "not_configured": "ยังไม่ได้ตั้งค่า AI Provider กรุณาตรวจสอบการตั้งค่าฝั่งเซิร์ฟเวอร์ (.env)",
    "vision_not_configured": "ยังไม่ได้ตั้งค่าโมเดลสำหรับวิเคราะห์ภาพ (AI_VISION_MODEL) ลองวิเคราะห์แบบข้อความ หรือให้แอดมินตั้งค่าโมเดลภาพก่อน",
    "invalid_api_key": "คีย์ API ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง กรุณาแจ้งแอดมินตรวจสอบ AI_API_KEY",
    "model_not_found": "ไม่พบโมเดลที่ตั้งค่าไว้บนผู้ให้บริการ AI กรุณาตรวจสอบชื่อโมเดลใน .env",
    "rate_limited": "ใช้งานเร็วเกินไป พักหนึ่งเพื่อให้หัวใจเย็นลงก่อน แล้วค่อยลองอีกครั้งนะ",
    "insufficient_credits": "เครดิตของผู้ให้บริการ AI อาจไม่เพียงพอ กรุณาตรวจสอบบัญชี API",
    "timeout": "การเชื่อมต่อ AI ใช้เวลานานเกินไป ลองอีกครั้งได้เลย",
    "network": "เชื่อมต่อ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    "vision_unsupported": "โมเดลที่เลือกไม่รองรับการวิเคราะห์ภาพ ลองวิเคราะห์แบบข้อความ หรือให้แอดมินเปลี่ยนโมเดลภาพ",
    "json_mode_unsupported": "ผู้ให้บริการไม่รองรับรูปแบบ JSON ที่ขอ ระบบจะใช้วิธีอื่นแท้",
    "bad_request": "คำขอไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง",
    "invalid_image": "ไฟล์นี้ไม่รองรับหรือเสียหาย กรุณาใช้รูป JPEG, PNG หรือ WebP",
    "image_too_large": "รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่มีขนาดเล็กลง",
    "invalid_ai_output": "AI ตอบกลับมาเพี้ยน ๆ กรุณากดวิเคราะห์ใหม่อีกครั้ง",
    "invalid_provider_response": "ผู้ให้บริการ AI ตอบข้อมูลกลับมาในรูปแบบที่ระบบอ่านไม่ได้ — ให้แอดมินตรวจว่า AI_API_BASE_URL ชี้ไปที่ API แบบ OpenAI-compatible จริง (มักจบด้วย /v1) และไม่ใช่หน้าเว็บธรรมดา",
    "provider_unavailable": "ผู้ให้บริการ AI ขัดข้องหรือไม่ว่างในตัวเอง (ฝั่งเขา ไม่ใช่ฝั่งมึง) ลองอีกครั้งภายหลัง หรือให้แอดมินเช็กสถานะ provider",
    "server_error": "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้งภายหลัง",
    "payload_too_large": "ข้อมูลส่งมาใหญ่เกินไป กรุณาลดขนาดรูปภาพ",
    "too_many_requests": "ใช้งานถี่เกินไป เดี๋ยวค่อยลองใหม่นะ",
    "not_enough_input": "ข้อมูลยังน้อยไป ใส่สิ่งที่ชอบหรือเรื่องเล่าเพิ่มอีกหน่อย แล้วกูจะเล่าเรื่องได้จับใจขึ้น",
}


class AppError(Exception):
    def __init__(self, code: str, status: int = 502, message: str | None = None):
        self.code = code
        self.status = status
        self.message = message or THAI_MESSAGES.get(code, THAI_MESSAGES["server_error"])
        super().__init__(self.code)


IMAGE_KEYWORDS = ("image", "vision", "multimodal", "image_url", "input image")
JSON_KEYWORDS = ("response_format", "json_object", "json_schema", "json mode")
CREDIT_KEYWORDS = ("quota", "credit", "billing", "insufficient", "balance")


def _match(msg: str, words) -> bool:
    return any(w in msg for w in words)


def classify_exception(exc: Exception) -> str:
    name = type(exc).__name__
    name_l = name.lower()
    msg = str(exc).lower()
    status = getattr(exc, "status_code", None)

    if "timeout" in name_l or "timed out" in msg:
        return "timeout"
    if "connection" in name_l:
        return "network"
    if (
        "responsevalidation" in name_l
        or ("validation" in name_l and "response" in name_l)
        or "contentdecod" in name_l
    ):
        return "invalid_provider_response"
    if status == 401:
        return "invalid_api_key"
    if status == 403:
        return "invalid_api_key"
    if status == 402:
        return "insufficient_credits"
    if status == 404:
        return "model_not_found"
    if status == 429:
        return "insufficient_credits" if _match(msg, CREDIT_KEYWORDS) else "rate_limited"
    if status in (400, 422):
        if _match(msg, IMAGE_KEYWORDS):
            return "vision_unsupported"
        if _match(msg, JSON_KEYWORDS):
            return "json_mode_unsupported"
        return "bad_request"
    if isinstance(status, int) and status >= 500:
        return "provider_unavailable"
    if "authentication" in name_l or "invalid api key" in msg or "invalid_api_key" in msg:
        return "invalid_api_key"
    if "not_found" in name_l or "model" in msg and "not found" in msg:
        return "model_not_found"
    if "rate limit" in msg or "rate_limit" in name_l:
        return "insufficient_credits" if _match(msg, CREDIT_KEYWORDS) else "rate_limited"
    return "server_error"


STATUS_BY_CODE = {
    "not_configured": 503,
    "vision_not_configured": 400,
    "invalid_api_key": 502,
    "model_not_found": 502,
    "rate_limited": 429,
    "insufficient_credits": 502,
    "timeout": 504,
    "network": 502,
    "vision_unsupported": 502,
    "json_mode_unsupported": 502,
    "bad_request": 400,
    "invalid_image": 400,
    "image_too_large": 413,
    "invalid_ai_output": 502,
    "invalid_provider_response": 502,
    "provider_unavailable": 502,
    "server_error": 500,
    "not_enough_input": 400,
}
