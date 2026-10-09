import { useState } from "react";
import { CheckCircle2, Eye, FlaskConical, Loader2, PlugZap, RefreshCw, XCircle } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../state/appState";

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; message: string; latencyMs?: number }
  | { status: "fail"; message: string };

const ENV_EXAMPLE = `AI_PROVIDER_NAME=ชื่อผู้ให้บริษัท AI
AI_API_BASE_URL=https://your-provider.example/v1
AI_API_KEY=your_api_key_here
AI_VISION_MODEL=your_vision_model
AI_TEXT_MODEL=your_text_model
AI_REQUEST_TIMEOUT=90
AI_MAX_RETRIES=1`;

export function SettingsPage() {
  const { state } = useApp();
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const cfg = state.config;

  async function runTest() {
    setTest({ status: "testing" });
    try {
      const res = await api.testConnection();
      if (res.ok) {
        setTest({ status: "ok", message: res.message, latencyMs: res.latencyMs });
      } else {
        setTest({ status: "fail", message: res.message });
      }
    } catch (e) {
      setTest({ status: "fail", message: e instanceof Error ? e.message : "เชื่อมต่อไม่สำเร็จ" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft">
          <FlaskConical size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">ตั้งค่า AI Provider</h1>
        <p className="max-w-lg text-xs leading-relaxed text-muted">
          ตั้งค่าผ่านไฟล์ <code className="rounded bg-white/10 px-1.5 py-0.5">.env</code> ฝั่งเซิร์ฟเวอร์
          แล้วรีสตาร์ท — คีย์ API ถูกเก็บบนเซิร์ฟเวอร์เท่านั้น ห้ามเผยแพร่เด็ดขาด
        </p>
      </header>

      {!state.configLoaded ? (
        <div className="glass p-8 text-center text-sm text-muted">กำลังโหลดการตั้งค่า...</div>
      ) : (
        <>
          <div className="glass divide-y divide-white/10">
            <Row label="ชื่อผู้ให้บริการ AI" value={cfg?.provider.name ?? "—"} />
            <Row label="ที่อยู่ API (Base URL)" value={cfg?.provider.baseUrl || "ยังไม่ได้ตั้งค่า"} mono />
            <Row
              label="โมเดลสำหรับวิเคราะห์ภาพ"
              value={cfg?.models.vision ?? "ยังไม่ได้ตั้ง (ใช้วิเคราะห์แบบข้อความได้)"}
              mono
              warn={!cfg?.visionConfigured}
            />
            <Row label="โมเดลสำหรับสนทนา" value={cfg?.models.text ?? "ยังไม่ได้ตั้งค่า"} mono warn={!cfg?.configured} />
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-bold">สถานะการเชื่อมต่อ</p>
                <p className="mt-0.5 text-xs text-muted">
                  {test.status === "ok" && `เชื่อมต่อได้ปกติ (${test.latencyMs}ms)`}
                  {test.status === "fail" && "มีปัญหา — กดทดสอบเพื่อดูรายละเอียด"}
                  {test.status === "idle" && (cfg?.configured ? "ยังไม่ได้ทดสอบในเซสชันนี้" : "ยังไม่ได้ตั้งค่า")}
                  {test.status === "testing" && "กำลังทดสอบ..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {test.status === "ok" && <CheckCircle2 size={22} className="text-emerald-400" />}
                {test.status === "fail" && <XCircle size={22} className="text-rose-400" />}
                <button className="btn btn-primary !py-2 text-sm" onClick={runTest} disabled={test.status === "testing"}>
                  {test.status === "testing" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <PlugZap size={15} />
                  )}
                  ทดสอบการเชื่อมต่อ
                </button>
              </div>
            </div>
          </div>

          {test.status === "ok" && (
            <div className="glass border border-emerald-400/40 p-4 text-sm leading-relaxed text-emerald-200 fade-up">
              {test.message}
            </div>
          )}
          {test.status === "fail" && (
            <div className="glass border border-rose-400/40 p-4 fade-up">
              <p className="text-sm leading-relaxed text-rose-200">{test.message}</p>
              <p className="mt-1.5 text-xs text-muted">
                ระบบไม่เปิดเผยรายละเอียดภายใน ให้แอดมินตรวจ .env ฝั่งเซิร์ฟเวอร์แทน
              </p>
              <button className="btn btn-ghost mt-3 !py-1.5 text-xs" onClick={runTest}>
                <RefreshCw size={13} />
                ลองอีกครั้ง
              </button>
            </div>
          )}

          <div className="glass p-5 sm:p-6">
            <h2 className="section-title mb-3">
              <Eye size={17} className="text-neocyan" />
              ตั้งค่าผ่านไฟล์ .env (สำหรับแอดมิน)
            </h2>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-night-950/80 p-4 text-[0.72rem] leading-relaxed text-muted">
              {ENV_EXAMPLE}
            </pre>
            <ul className="mt-4 space-y-2 text-xs leading-relaxed text-muted">
              <li>• รองรับผู้ให้บริการที่ใช้ API แบบเข้ากันได้กับ OpenAI (Chat Completions)</li>
              <li>• ชื่อโมเดลไม่จำเป็นต้องขึ้นต้นด้วย gpt- ใช้ชื่อที่ผู้ให้บริการรองรับได้เลย</li>
              <li>• ถ้าโมเดลภาพไม่รองรับรูป ระบบจะแจ้งชัดเจนและให้วิเคราะห์แบบข้อความแทน</li>
              <li>• เปลี่ยนค่าใน .env แล้วรีสตาร์ทเซิร์ฟเวอร์ได้เลย ไม่ต้องแก้โค้ด</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  warn,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-5">
      <span className="text-sm font-bold">{label}</span>
      <span
        className={`max-w-full break-all rounded-lg border px-3 py-1 text-xs ${
          warn
            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
            : "border-white/10 bg-white/5 text-muted"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
