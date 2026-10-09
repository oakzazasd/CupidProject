import { useEffect, useRef, useState } from "react";
import { Eraser, RefreshCw, SendHorizonal } from "lucide-react";
import { api, errorMessage } from "../api/client";
import { CHAT_MODE_LABEL, SUGGESTED_QUESTIONS } from "../lib/fun";
import { newId, useApp } from "../state/appState";
import type { Report } from "../types";

export function ChatPanel() {
  const { state, dispatch } = useApp();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const report = state.report as Report | null;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, state.chatPending]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || state.chatPending || !report) return;
    const userMsg = { id: newId(), role: "user" as const, content: trimmed, isError: false };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    dispatch({ type: "SET_CHAT_PENDING", value: true });
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
      dispatch({
        type: "ADD_MESSAGE",
        message: { id: newId(), role: "assistant", content: res.reply },
      });
    } catch (e) {
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: newId(),
          role: "assistant",
          content: `${errorMessage(e)}\n(ข้อความนี้ส่งไม่สำเร็จ กดลองใหม่ด้านล่างได้เลย)`,
          isError: true,
        },
      });
    } finally {
      dispatch({ type: "SET_CHAT_PENDING", value: false });
    }
  }

  useEffect(() => {
    if (state.pendingAsk) {
      const ask = state.pendingAsk;
      dispatch({ type: "SET_PENDING_ASK", text: null });
      send(ask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingAsk]);

  function retryLast() {
    const lastUser = [...state.messages].reverse().find((m) => m.role === "user");
    if (lastUser) send(lastUser.content);
  }

  const hasError = state.messages.some((m) => m.isError);

  return (
    <div className="glass flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
        <div>
          <h3 className="font-bold">คุยกับ Cupid AI ต่อ</h3>
          <p className="text-[0.7rem] text-muted">
            โหมดปัจจุบัน: {CHAT_MODE_LABEL[state.mode]} · แชตหายเมื่อรีเฟรชหน้า
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost !py-1.5 text-xs"
            onClick={() => dispatch({ type: "CLEAR_CHAT" })}
          >
            <Eraser size={14} />
            ล้างแชต
          </button>
          <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => dispatch({ type: "RESET_ALL" })}>
            <RefreshCw size={14} />
            วิเคราะห์ใหม่
          </button>
        </div>
      </div>

      <div ref={listRef} className="max-h-[420px] min-h-[240px] space-y-3 overflow-y-auto px-5 py-4">
        {state.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`msg-bubble ${m.role === "user" ? "msg-user" : m.isError ? "msg-ai msg-error" : "msg-ai"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {state.chatPending && (
          <div className="flex justify-start">
            <div className="msg-bubble msg-ai flex items-center gap-1.5 !py-3" aria-label="Cupid AI กำลังพิมพ์">
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
              <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        {hasError && !state.chatPending && (
          <div className="flex justify-center">
            <button className="btn btn-ghost !py-1.5 text-xs" onClick={retryLast}>
              ลองส่งอีกครั้ง
            </button>
          </div>
        )}
      </div>

      {state.messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button key={q} className="chip" onClick={() => send(q)} disabled={state.chatPending}>
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2.5 border-t border-white/10 p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
          setText("");
        }}
      >
        <input
          className="field flex-1"
          placeholder={state.chatPending ? "Cupid AI กำลังคิด..." : "ถามอะไรก็ได้ ไม่กัดหรอก (เว้นแต่จะขอโดนแซะ)"}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          disabled={state.chatPending}
          aria-label="ข้อความถึง Cupid AI"
        />
        <button
          type="submit"
          className="btn btn-primary !px-4"
          disabled={state.chatPending || !text.trim()}
          aria-label="ส่งข้อความ"
        >
          <SendHorizonal size={18} />
        </button>
      </form>
    </div>
  );
}
