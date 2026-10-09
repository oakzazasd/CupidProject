import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Heart, ImageOff, Settings2, Sparkles } from "lucide-react";
import { api, errorCode, errorMessage } from "../api/client";
import { AICore } from "../components/AICore";
import { InterestPicker } from "../components/InterestPicker";
import { PhotoUpload } from "../components/PhotoUpload";
import { RelationshipForm } from "../components/RelationshipForm";
import { ReportView } from "../components/ReportView";
import { ChatPanel } from "../components/ChatPanel";
import { ANALYZE_STEPS } from "../lib/fun";
import { newId, useApp } from "../state/appState";
import type { OrbState } from "../types";

interface AnalyzePageProps {
  orbState: OrbState;
}

const STEPS = ["รูปภาพ", "สิ่งที่ชอบ", "ข้อมูลเพิ่ม"];

export function AnalyzePage({ orbState }: AnalyzePageProps) {
  const { state, dispatch } = useApp();
  const [stepMsg, setStepMsg] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);

  const phase = state.analyzing ? "analyzing" : state.report ? "result" : "form";
  const hasAnyInput =
    state.myInterests.length > 0 ||
    state.theirInterests.length > 0 ||
    state.interactionNotes.trim().length > 0 ||
    state.photos.user != null ||
    state.photos.crush != null;

  const matchedInterests = useMemo(
    () => state.myInterests.filter((x) => state.theirInterests.includes(x)),
    [state.myInterests, state.theirInterests]
  );

  useEffect(() => {
    if (phase !== "analyzing") {
      setStepMsg(0);
      return;
    }
    const timer = setInterval(() => {
      setStepMsg((v) => (v + 1) % ANALYZE_STEPS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [phase]);

  async function runAnalyze() {
    setSubmitError(null);
    setSubmitErrorCode(null);
    dispatch({ type: "SET_ANALYZING", value: true });
    try {
      const res = await api.analyze({
        userPhoto: state.photos.user ?? undefined,
        crushPhoto: state.photos.crush ?? undefined,
        myInterests: state.myInterests,
        theirInterests: state.theirInterests,
        matchedInterests,
        relationship: state.relationship,
        interactionNotes: state.interactionNotes,
      });
      dispatch({ type: "SET_REPORT", report: res.report, usedVision: res.meta.usedVision });
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: newId(),
          role: "assistant",
          content: `ผลออกแล้วนะ — "${res.report.verdict}" มีอะไรอยากถามต่อก็พิมพ์มา จะขอคำแนะนำหรือขอโดนแซะก็ได้ 😏`,
        },
      });
    } catch (e) {
      setSubmitError(errorMessage(e));
      setSubmitErrorCode(errorCode(e));
      dispatch({ type: "SET_ANALYZING", value: false });
    }
  }

  if (phase === "analyzing") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-8 py-10 text-center">
        <AICore size={280} state="analyzing" />
        <div>
          <p className="text-lg font-extrabold">{ANALYZE_STEPS[stepMsg]}</p>
          <p className="mt-1.5 text-xs text-muted">
            ใจเย็น ๆ ความรักมันรีบไม่ได้ (แต่ถ้าช้าไปก็กด "ลองอีกครั้ง" ได้)
          </p>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <ReportView />
        <ChatPanel />
      </div>
    );
  }

  const notConfigured = state.configLoaded && !state.config?.configured;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <AICore size={150} state={orbState} />
        <h1 className="text-2xl font-extrabold sm:text-3xl">วิเคราะห์ความเข้ากันได้ 💘</h1>
        <p className="max-w-lg text-xs leading-relaxed text-muted">
          ไม่ต้องกรอกชื่อใคร ไม่ต้องสมัครสมาชิก ข้อมูลทั้งหมดอยู่แค่ในหน้านี้และจะหายไปเมื่อปิด/รีเฟรช
        </p>
      </header>

      {notConfigured && (
        <div className="glass border border-amber-400/40 p-4 text-center">
          <p className="text-sm font-semibold text-amber-200">
            ยังไม่ได้ตั้งค่า AI Provider ฝั่งเซิร์ฟเวอร์
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Cupid AI ตอนนี้หลับอยู่ ให้แอดมินเติมค่าในไฟล์ .env (AI_API_BASE_URL, AI_API_KEY,
            AI_TEXT_MODEL ฯลฯ) แล้วรีสตาร์ทเซิร์ฟเวอร์
          </p>
          <button
            className="btn btn-ghost mt-3 !py-2 text-xs"
            onClick={() => dispatch({ type: "SET_PAGE", page: "settings" })}
          >
            <Settings2 size={14} />
            ไปหน้าตั้งค่า
          </button>
        </div>
      )}

      <div className="flex items-center gap-2" role="tablist" aria-label="ขั้นตอน">
        {STEPS.map((label, i) => (
          <button
            key={label}
            role="tab"
            aria-selected={state.step === i}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors sm:text-sm ${
              state.step === i
                ? "border-accent/50 bg-accent-soft text-white"
                : "border-white/10 bg-night-900/50 text-muted"
            }`}
            onClick={() => dispatch({ type: "SET_STEP", step: i })}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${
                state.step === i ? "bg-accent text-white" : "bg-white/10 text-muted"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      {state.step === 0 && (
        <div className="space-y-4 fade-up">
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoUpload
              which="user"
              title="รูปของคุณ 🤳"
              hint="แค่รูปเดียวพอ ไม่ต้องหล่อขึ้นมาเอง"
              photo={state.photos.user}
              onSet={(d) => dispatch({ type: "SET_PHOTO", which: "user", dataUrl: d })}
              onRemove={() => dispatch({ type: "REMOVE_PHOTO", which: "user" })}
            />
            <PhotoUpload
              which="crush"
              title="รูปคนที่คุณแอบชอบ 🥰"
              hint="อย่าลืมขออนุญาตเจ้าของรูปก่อนนะ 🙏"
              photo={state.photos.crush}
              onSet={(d) => dispatch({ type: "SET_PHOTO", which: "crush", dataUrl: d })}
              onRemove={() => dispatch({ type: "REMOVE_PHOTO", which: "crush" })}
            />
          </div>
          <div className="glass-subtle flex items-start gap-3 p-4">
            <ImageOff size={18} className="mt-0.5 shrink-0 text-neocyan" />
            <p className="text-xs leading-relaxed text-muted">
              รูปถูกใช้แค่ครั้งเดียวเพื่อความสนุกและถูกลบทันทีหลังวิเคราะห์ — AI
              ไม่ได้ดูหน้าตาเพื่อคิดคะแนน (มันทำไม่ได้ และเราก็ไม่ให้ทำ)
              <br />
              ไม่อยากใส่รูปกดข้ามได้เลย เลือกแบบ "ข้อความล้วน" ก็หวานเหมือนกัน
            </p>
          </div>
        </div>
      )}

      {state.step === 1 && (
        <div className="fade-up">
          <InterestPicker />
        </div>
      )}

      {state.step === 2 && (
        <div className="space-y-4 fade-up">
          <RelationshipForm />
          {(submitError || state.analyzeError) && (
            <div className="glass border border-rose-400/40 p-4">
              <p className="text-sm leading-relaxed text-rose-200">
                {submitError ?? state.analyzeError}
              </p>
              <p className="mt-1 text-[0.7rem] text-muted">
                ถ้าเพิ่งอัปโหลดรูปมา รูปชั่วคราวถูกล้างออกจากระบบแล้ว ลองใหม่อีกครั้งได้เลย
                {submitErrorCode && (
                  <>
                    {" "}· รหัสข้อผิดพลาด:{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">{submitErrorCode}</code>
                  </>
                )}
              </p>
            </div>
          )}
          <button
            className="btn btn-primary w-full !py-4 text-base"
            onClick={runAnalyze}
            disabled={notConfigured || !hasAnyInput}
          >
            <Heart size={19} />
            {notConfigured
              ? "รอแอดมินตั้งค่าก่อนนะ..."
              : hasAnyInput
                ? "วิเคราะห์ความเข้ากันได้เลย!"
                : "ใส่ข้อมูลอย่างน้อยหน่อยนะ (สิ่งที่ชอบหรือเรื่องเล่า)"}
          </button>
        </div>
      )}

      {state.step < 2 ? (
        <div className="flex items-center justify-between">
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: "SET_STEP", step: Math.max(0, state.step - 1) })}
            disabled={state.step === 0}
          >
            <ArrowLeft size={16} />
            ย้อนกลับ
          </button>
          <button
            className="btn btn-outline-accent"
            onClick={() => dispatch({ type: "SET_STEP", step: state.step + 1 })}
          >
            ถัดไป
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
          >
            <ArrowLeft size={16} />
            ย้อนกลับ
          </button>
          <span className="flex items-center gap-1.5 text-[0.7rem] text-muted">
            <Camera size={12} />
            กดวิเคราะห์ = ยอมรับว่าอาจโดนแซะ
            <Sparkles size={12} />
          </span>
        </div>
      )}
    </div>
  );
}
