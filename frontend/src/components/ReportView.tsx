import { useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  Heart,
  MessageCircleHeart,
  Music4,
  RefreshCw,
  Send,
  ShieldCheck,
  Skull,
  Sparkles,
} from "lucide-react";
import { useApp, newId } from "../state/appState";
import { api, errorMessage } from "../api/client";
import { confidenceLabel } from "../lib/fun";
import { ScoreReveal } from "./ScoreReveal";
import type { Report } from "../types";

export function ReportView() {
  const { state, dispatch } = useApp();
  const report = state.report as Report;
  const [showExplain, setShowExplain] = useState(false);
  const [modeBusy, setModeBusy] = useState(false);

  const matched = state.myInterests.filter((x) => state.theirInterests.includes(x));
  const aiSuggestions = report.shared_interests.filter((s) => !matched.includes(s.topic));

  async function switchMode(mode: "normal" | "savage") {
    dispatch({ type: "SET_MODE", mode });
    const text =
      mode === "savage"
        ? "เปลี่ยนเป็นโหมดแซะแล้วนะ แซะหน่อยดิว่าจากผลวิเคราะห์นี้"
        : "โอเค กลับมาโหมดปลอบใจ ช่วยแนะนำแบบใจดีหน่อยนะ";
    await sendChat(text);
  }

  async function sendChat(text: string) {
    if (state.chatPending) return;
    const userMsg = { id: newId(), role: "user" as const, content: text, isError: false };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    dispatch({ type: "SET_CHAT_PENDING", value: true });
    setModeBusy(true);
    try {
      const history = [...state.messages, userMsg]
        .filter((m) => !m.isError)
        .slice(-16)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chat({
        mode: state.mode,
        messages: history,
        reportContext: {
          score: report.score,
          verdict: report.verdict,
          summary: report.summary,
          sharedInterests: report.shared_interests,
        },
      });
      dispatch({ type: "ADD_MESSAGE", message: { id: newId(), role: "assistant", content: res.reply } });
    } catch (e) {
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: newId(),
          role: "assistant",
          content: `${errorMessage(e)} (ลองส่งใหม่ได้ในห้องแชตด้านล่างนะ)`,
          isError: true,
        },
      });
    } finally {
      dispatch({ type: "SET_CHAT_PENDING", value: false });
      setModeBusy(false);
    }
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="glass p-6 sm:p-8">
        <ScoreReveal score={report.score} verdict={report.verdict} />

        <div className="mx-auto mt-6 max-w-2xl">
          <p className="text-center text-sm leading-8 text-ink">{report.summary}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-muted">
              ความมั่นใจของ AI: {confidenceLabel(report.confidence)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-muted">
              {state.usedVision ? "วิเคราะห์พร้อมรูป (เพื่อความสนุก)" : "วิเคราะห์จากข้อความ"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button
            className={`btn ${state.mode === "normal" && !state.heartbreakActive ? "btn-active-mode" : "btn-ghost"}`}
            onClick={() => switchMode("normal")}
            disabled={modeBusy || state.chatPending}
          >
            <Heart size={16} />
            ปลอบใจหน่อย
          </button>
          <button
            className={`btn ${state.mode === "savage" && !state.heartbreakActive ? "btn-active-mode" : "btn-ghost"}`}
            onClick={() => switchMode("savage")}
            disabled={modeBusy || state.chatPending}
          >
            <Flame size={16} />
            แซะฉันเลย
          </button>
          <button
            className="btn btn-romance"
            onClick={() => {
              dispatch({ type: "SET_MODE", mode: "heartbreak" });
              dispatch({ type: "SET_HEARTBREAK", value: true });
            }}
          >
            <Skull size={16} />
            ตบสติฉันที 💀
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              dispatch({ type: "SET_MUSIC_OPEN", value: true });
              if (!state.heartbreakActive) {
                dispatch({ type: "SET_MODE", mode: "heartbreak" });
                dispatch({ type: "SET_HEARTBREAK", value: true });
              }
            }}
          >
            <Music4 size={16} />
            เปิดเพลงเศร้า
          </button>
          <button className="btn btn-outline-accent" onClick={() => dispatch({ type: "RESET_ALL" })}>
            <RefreshCw size={16} />
            เริ่มวิเคราะห์ใหม่
          </button>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[0.72rem] text-muted">
          <ShieldCheck size={13} className="text-emerald-400" />
          รูปที่อัปโหลดถูกลบออกจากระบบแล้ว เหลือไว้แค่ผลวิเคราะห์ในหน้านี้ (กดรีเฟรชก็หาย)
        </p>
      </div>

      {(matched.length > 0 || aiSuggestions.length > 0) && (
        <div className="glass p-5 sm:p-6">
          <h3 className="section-title mb-4">
            <Sparkles size={18} className="text-romance" />
            สิ่งที่ชอบเหมือนกัน / น่าชวนคุย
          </h3>
          {matched.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-bold text-emerald-300">💘 ตรงกันชัด ๆ</p>
              <div className="flex flex-wrap gap-2">
                {matched.map((m, i) => (
                  <span
                    key={m}
                    className="tag-in rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-200"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {aiSuggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold text-neocyan">💡 ไอเดียจาก AI (ยังไม่ใช่แมตช์จริง ลองไปคุยดู)</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {aiSuggestions.map((s, i) => (
                  <div
                    key={s.topic}
                    className="tag-in glass-subtle flex items-start gap-2.5 p-3.5"
                    style={{ animationDelay: `${(matched.length + i) * 70}ms` }}
                  >
                    <span className="mt-0.5 rounded-lg border border-neocyan/30 bg-neocyan/10 px-2 py-0.5 text-xs font-bold text-neocyan">
                      {s.topic}
                    </span>
                    {s.note && <span className="text-xs leading-relaxed text-muted">{s.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {report.conversation_starters.length > 0 && (
        <div className="glass p-5 sm:p-6">
          <h3 className="section-title mb-4">
            <MessageCircleHeart size={18} className="text-romance" />
            ประโยคเปิดบทสนทนา — กดเพื่อให้ AI ช่วยต่อประโยค
          </h3>
          <div className="space-y-2.5">
            {report.conversation_starters.map((s, i) => (
              <button
                key={i}
                className="tag-in msg-bubble msg-ai w-full !max-w-none text-left transition-colors hover:border-neocyan/50"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() =>
                  dispatch({
                    type: "SET_PENDING_ASK",
                    text: `ควรใช้ประโยคนี้ไหม "${s}" ช่วยปรับให้เนียนขึ้นหน่อย`,
                  })
                }
                disabled={state.chatPending}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {report.flirting_tips.length > 0 && (
        <div className="glass p-5 sm:p-6">
          <h3 className="section-title mb-4">
            <Flame size={18} className="text-romance" />
            เทคนิคจีบแบบเนียน ๆ
          </h3>
          <ul className="space-y-2.5">
            {report.flirting_tips.map((t, i) => (
              <li
                key={i}
                className="tag-in glass-subtle flex items-start gap-2.5 p-3.5 text-sm leading-relaxed"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-romance" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.next_step && (
        <div className="glass border-romance/30 p-5 sm:p-6">
          <h3 className="section-title mb-3">
            <Send size={18} className="text-romance" />
            ขั้นตอนต่อไปที่แนะนำ
          </h3>
          <p className="rounded-xl border border-romance/30 bg-romance/10 p-4 text-sm leading-8">
            {report.next_step}
          </p>
        </div>
      )}

      <div className="glass p-5 sm:p-6">
        <button
          className="flex w-full items-center justify-between gap-3"
          onClick={() => setShowExplain((v) => !v)}
          aria-expanded={showExplain}
        >
          <span className="section-title !mb-0">
            {showExplain ? <EyeOff size={18} className="text-neocyan" /> : <Eye size={18} className="text-neocyan" />}
            AI ให้คะแนนนี้จากอะไร?
          </span>
          <ChevronDown size={18} className={`text-muted transition-transform ${showExplain ? "rotate-180" : ""}`} />
        </button>
        {showExplain && (
          <p className="mt-4 rounded-xl border border-white/10 bg-night-900/60 p-4 text-sm leading-8 text-muted fade-up">
            {report.score_explanation || "จากสิ่งที่ชอบตรงกันและเรื่องที่เล่ามา (ไม่ได้ดูจากหน้าตานะ มันดูไม่ได้จริง ๆ)"}
            <span className="mt-2 block text-xs">
              โปรดจำไว้: คะแนนนี้เพื่อความบันเทิงล้วน ๆ ไม่ใช่ความน่าจะเป็นทางวิทยาศาสตร์ และไม่ได้แปลว่าเขามีใจคุณแน่นอน
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
