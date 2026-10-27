# Cupid AI 💘

ผู้ช่วยวิเคราะห์ความรักจากอวกาศ — เว็บแอปความบันเทิงสไตล์ sci-fi command center ที่ช่วยมึงวิเคราะห์คนที่แอบชอบ คิดคะแนนความเข้ากันได้แบบฮา ๆ แซะได้ เปิดเพลงเศร้าได้ และไม่เก็บข้อมูลอะไรของมึงเลยสักนิด

> **เตือนใจ:** คะแนนทั้งหมดเป็นความบันเทิงล้วน ๆ AI ไม่สามารถอ่านใจใครได้จากรูปถ่าย และเราก็ไม่ให้มันพยายาม

## ความสามารถ

- 📸 อัปโหลด / ถ่ายรูปตัวเอง + คนที่แอบชอบ (รูปถูกลบทันทีหลังวิเคราะห์) หรือเลือกวิเคราะห์แบบข้อความล้วน
- 💘 คะแนนความเข้ากันได้ 0–100% พร้อมคำตัดสินและคำอธิบายว่าคะแนนมาจากอะไร
- ✨ ระบบสิ่งที่ชอบเหมือนกัน พร้อมไอเดียบทสนทนา
- 💬 แชตถามต่อกับ Cupid AI (ชั่วคราว หายเมื่อรีเฟรช) ตอบไทย/อังกฤษตามที่ผู้ใช้พิมพ์
- 😏 3 โหมดบุคลิก: ปลอบใจ / แซะฉันเลย / โหมดเศร้า (Heartbreak) พร้อมเอฟเฟกต์ฝนตก
- 🎵 เปิดเพลงเศร้าจาก YouTube แบบ embed ทางการ (เล่นเมื่อผู้ใช้กดเท่านั้น)
- 🛠 หน้าตั้งค่าแสดงสถานะ Provider + ปุ่มทดสอบการเชื่อมต่อจริง
- 🈶 หน้าเว็บเป็นภาษาไทยทั้งหมด

## เทคโนโลยี

| ฝั่ง | ใช้อะไร |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Lucide icons |
| Backend | Python + Flask + OpenAI SDK (custom `base_url`) + Pydantic |
| Storage | **ไม่มีฐานข้อมูล** — ทุกอย่างอยู่ในหน่วยความจำของเบราว์เซอร์เท่านั้น |

## การติดตั้ง

### 1) Backend

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# แก้ค่าใน backend/.env ให้ตรงกับผู้ให้บริการของมึง

cd backend
python app.py                      # รันที่พอร์ต 5050 (เลี่ยงพอร์ต 5000 ที่ macOS AirPlay ยึดอยู่)
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev        # เปิด http://localhost:5173
```

Vite ตั้ง proxy `/api` → `http://127.0.0.1:5050` ให้อัตโนมัติแล้ว (แก้ได้ใน `vite.config.ts`)

### 3) Production (VPS)

`npm run dev` ใช้เฉพาะเครื่องพัฒนา — ห้ามใช้เป็นเซิร์ฟเวอร์จริง เพราะจะโหลดช้ามาก

```bash
cd frontend
npm ci --include=dev     # ต้องมี dev deps สำหรับ build (สำคัญถ้า NODE_ENV=production)
npm run build
npm run start            # เสิร์ฟ dist บนพอร์ต 5173 + proxy /api → 127.0.0.1:5050
```

- `npm run start` ใช้ `server.mjs` (ไม่ต้องพึ่ง nginx) — มี gzip/brotli, cache header และ SPA fallback
- ปรับ `PORT`, `HOST`, `API_TARGET` ผ่าน env ได้
- ต้องรัน `npm run build` ใหม่ทุกครั้งหลังแก้โค้ด แล้วค่อย restart process

หรือเปิดทั้ง backend + frontend พร้อมกันจาก root (สคริปต์สำหรับ VPS ที่ใช้ `screen`):

```bash
./start.sh   # ติดตั้ง deps + build production + start ทั้งสองตัว
```

> ⚠️ **ผู้ใช้ macOS:** ห้ามใช้พอร์ต 5000 — macOS AirPlay Receiver (ControlCenter) ยึดพอร์ตนี้ไว้ ทำให้ proxy ชนกันโดยไม่มี error ชัดเจน

### 3) ทดสอบ

```bash
# Backend
.venv/bin/python -m pytest backend/tests -q

# Frontend typecheck + build
cd frontend && npm run build
```

## การตั้งค่า Custom OpenAI-Compatible Provider

Cupid AI **ไม่ได้ผูกกับ OpenAI ทางการ** — ใช้กับผู้ให้บริการ / gateway / self-hosted proxy ใด ๆ ที่รองรับ Chat Completions API แบบเข้ากันได้

แก้ไฟล์ `backend/.env`:

```dotenv
AI_PROVIDER_NAME=Custom Provider        # ชื่อที่โชว์ในหน้าตั้งค่า
AI_API_BASE_URL=https://your-provider.example/v1
AI_API_KEY=your_api_key_here

AI_VISION_MODEL=your_vision_model       # โมเดลที่รองรับรูปภาพ (เว้นว่าง = ปิดโหมดรูป)
AI_TEXT_MODEL=your_text_model           # โมเดลสนทนา/วิเคราะห์ (บังคับ)

AI_REQUEST_TIMEOUT=90                   # วินาที
AI_MAX_RETRIES=1                        # อย่าตั้งสูง ๆ เดี๋ยวเงินหาย
AI_JSON_MODE=auto                       # auto | on | off (ดูด้านล่าง)

SAD_MUSIC_YOUTUBE_ID=                   # video/playlist id สำหรับโหมดเศร้า (เว้นว่าง = เปิด YouTube search)

FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_IMAGE_MB=8

RATE_LIMIT_ANALYZE_PER_HOUR=8
RATE_LIMIT_CHAT_PER_10MIN=40
RATE_LIMIT_TEST_PER_MIN=5
```

### Base URL ใช้ยังไง

- ตั้งเป็นรากของ API เช่น `https://gateway.example.com/v1`
- ระบบตัด `/` ท้าย และตัด `/chat/completions` ท้ายให้อัตโนมัติ (กันการซ้ำซ้อน)
- **ไม่มี fallback ไป api.openai.com แม้แต่บรรทัดเดียว** — คำขอไปที่ URL ที่ตั้งเท่านั้น

### โมเดล

- ชื่อโมเดลไม่จำเป็นต้องขึ้นต้น `gpt-` — ใช้ชื่ออะไรก็ได้ที่ผู้ให้บริการรองรับ
- `AI_VISION_MODEL` ต้องเป็นโมเดลที่รองรับรูปภาพจริง ถ้าไม่รองรับ API จะ error และระบบแจ้งผู้ใช้เป็นภาษาไทยพร้อมทางเลือก (วิเคราะห์แบบข้อความ) — ระบบ**ไม่สลับไปใช้โมเดลอื่นเงียบ ๆ**

### JSON Mode

- `auto` (ค่าเริ่มต้น): ลอง `response_format: json_object` ก่อน ถ้า provider ไม่รองรับจะถอยไปขอ JSON ใน prompt แล้ว validate/parse เอง
- `on`: บังคับใช้ `response_format` เลย
- `off`: ไม่ส่ง `response_format` เลย (สำหรับ provider ที่แปลกหน้า)

### การทดสอบการเชื่อมต่อ

เปิดเว็บ → หน้า "ตั้งค่า" → กด **ทดสอบการเชื่อมต่อ** — ระบบยิงคำขอ text สั้น ๆ จริง ๆ ไปที่ provider แล้วรายงานผล + latency (ไม่แสดงคีย์ API เด็ดขาด)

### Troubleshooting

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| "คีย์ API ไม่ถูกต้อง" | `AI_API_KEY` ผิด / หมดอายุ / ไม่มีสิทธิ์ |
| "ไม่พบโมเดลที่ตั้งค่าไว้" | ชื่อใน `AI_TEXT_MODEL` / `AI_VISION_MODEL` ผิด หรือ Base URL ผิด (เช่น ลืม `/v1`) |
| "โมเดลไม่รองรับการวิเคราะห์ภาพ" | โมเดลภาพเป็น text-only — เปลี่ยนโมเดล หรือใช้แบบข้อความล้วน |
| "เครดิตอาจไม่เพียงพอ" | บัญชี provider หมดเครดิต/โควตา (รวมกรณี 402 Payment Required) |
| "ผู้ให้บริการตอบข้อมูลกลับมาในรูปแบบที่ระบบอ่านไม่ได้" | Base URL ชี้ไปที่หน้าเว็บ/endpoint ผิด — ตรวจว่าเป็น API แบบ OpenAI-compatible จริง (มักจบด้วย `/v1`) |
| "ผู้ให้บริการ AI ขัดข้องหรือไม่ว่าง" | ระบบของ provider ล่ม/ล่มชั่วคราว (5xx ฝั่งเขา) — ลองอีกครั้งภายหลัง |
| "เชื่อมต่อ AI ไม่สำเร็จ" | Base URL ผิด, เครือข่าย, หรือ provider ล่ม |
| "ระบบขัดข้องชั่วคราว" | ดู log ใน terminal ของ backend บรรทัดที่ขึ้นต้น `[cupid]` จะบอก class ของ error |

## ความปลอดภัยและความเป็นส่วนตัว

- 🔑 **คีย์ API อยู่บนเซิร์ฟเวอร์เท่านั้น** — ไม่มีใน frontend bundle, ไม่มีใน response, ไม่มีใน log
- 🖼 รูปภาพ: ตรวจ magic bytes + MIME, ย่อ/บีบในหน่วยความจำ (ไม่เขียนดิสก์), ลบทิ้งทันทีหลังวิเคราะห์ (ทั้งกรณีสำเร็จและล้มเหลว)
- 🚫 ไม่มี login / ฐานข้อมูล / localStorage — รีเฟรชแล้วทุกอย่างหาย
- ⏱ Rate limiting ต่อ IP (ปรับได้ใน .env) กันค่า API พุ่ง
- 🛡 CORS จำกัด origin, จำกัดขนาด request, ป้องกัน prompt injection (ข้อมูลผู้ใช้ถูกห่อใน `<user_data>` พร้อมคำสั่งให้ AI ไม่ทำตามคำสั่งที่ซ่อน)
- 🤫 ไม่ log คีย์ / รูป / ข้อความแชต / prompt เต็ม

**ข้อจำกัดที่ควรรู้:** การลบรูปฝั่งแอปพลิเคชันไม่รับประกันว่าผู้ให้บริการ AI หรือโครงสร้างพื้นฐานของเขาจะลบสำเนาที่ได้รับไปแล้ว — เรื่องนี้อยู่นอกการควบคุมของเรา เช่นเดียวกับข้อความแชตที่ส่งไปแล้ว

## โครงสร้างโปรเจกต์

```
backend/
  app.py                  # create_app, error handlers
  cupid/
    config.py             # env config + base URL normalization
    errors.py             # error codes + ข้อความไทย + classifier
    images.py             # validate/re-encode รูป in-memory
    prompts.py            # บุคลิก AI + schema + ป้องกัน prompt injection
    parsing.py            # Pydantic models + JSON extraction
    provider.py           # OpenAI-compatible client
    ratelimit.py          # in-memory rate limiter
    api/                  # Flask routes (meta / analyze / chat)
  tests/                  # pytest (45 tests)
frontend/
  src/
    api/client.ts         # fetch wrapper + error mapping
    components/           # AICore, PhotoUpload, Report, Chat, Heartbreak, Music...
    pages/                # Home, Analyze, Settings
    state/appState.tsx    # in-memory reducer (ไม่มี persistence)
    lib/                  # image processing, interests, fun texts
```

## ข้อจำกัดที่ยังไม่ได้ทดสอบจริง

- การเรียก provider จริง (vision/JSON mode) ทดสอบด้วย mock — ควรลองกับ provider จริงของมึงก่อนใช้งานจริง
- YouTube IFrame embed ต้องทดสอบกับ video/playlist id ที่ตั้งจริง (บาง video ปิดสิทธิ์ embed — ระบบจะ fallback เปิดลิงก์ให้)

---

ปล. ถ้าคะแนนออกมาต่ำ อย่าเพิ่งเลิกตัดผม แค่เลิกส่ง "ทำไรอยู่" รอบที่เจ็ดก็พอ 💀
