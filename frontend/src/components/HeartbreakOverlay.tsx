import { useMemo } from "react";
import { Flame, Music4, RefreshCw, Sunrise } from "lucide-react";
import { useApp } from "../state/appState";
import { AICore } from "./AICore";
import { MusicPlayer } from "./MusicPlayer";

function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        x: (i * 97 + 13) % 100,
        dur: 0.7 + ((i * 37) % 70) / 100,
        delay: ((i * 53) % 200) / 100,
      })),
    []
  );
  return (
    <div className="rain" aria-hidden="true">
      {drops.map((d, i) => (
        <span
          key={i}
          className="drop"
          style={
            {
              ["--drop-x" as string]: `${d.x}%`,
              ["--drop-dur" as string]: `${d.dur}s`,
              ["--drop-delay" as string]: `${d.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function HeartbreakOverlay() {
  const { state, dispatch } = useApp();
  const report = state.report;
  const roast = report?.roast || "ดูเหมือนหัวใจฝ่ายนี้กำลังเล่นเกม Single-player ในขณะที่อีกฝ่ายยังไม่ได้กด Join 🥀";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#05070f]/95 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="โหมดเศร้า"
    >
      <Rain />
      <div className="relative z-10 w-full max-w-lg space-y-6 py-8 text-center">
        <div className="heartbeat-reveal mx-auto flex justify-center">
          <AICore size={190} state="heartbreak" />
        </div>

        <div className="heartbeat-reveal" style={{ animationDelay: "0.35s" }}>
          <p className="text-[0.7rem] font-bold tracking-[0.35em] text-indigo-300/80 uppercase">
            Heartbreak Protocol
          </p>
          <h2 className="mt-2 bg-gradient-to-b from-indigo-200 to-indigo-400 bg-clip-text text-2xl font-extrabold leading-relaxed text-transparent sm:text-3xl">
            ผลวิเคราะห์ออกมาแล้ว...
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-9 text-indigo-100/90">{roast}</p>
          <p className="mt-2 text-[0.72rem] leading-relaxed text-muted">
            (คะแนนนี้แค่ความบันเทิง ไม่ได้ยืนยันว่าโดนปฏิเสธนะ แค่หลักฐานยังไม่เข้าข้างฝ่ายเราเท่าไหร่)
          </p>
        </div>

        <div className="fade-up" style={{ animationDelay: "0.6s" }}>
          {state.musicOpen ? (
            <MusicPlayer
              youtubeId={state.config?.sadMusic.youtubeId ?? null}
              fallbackUrl={state.config?.sadMusic.fallbackUrl ?? "https://www.youtube.com"}
              autoplayAttempt={state.autoplayMusic}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                className="btn btn-romance"
                onClick={() => dispatch({ type: "SET_MUSIC_OPEN", value: true })}
              >
                <Music4 size={16} />
                ขอเพลงเศร้าหน่อย ไม่ไหวแล้ว 💀
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  dispatch({ type: "SET_MODE", mode: "savage" });
                  dispatch({ type: "SET_HEARTBREAK", value: false });
                  dispatch({ type: "SET_PENDING_ASK", text: "เพิ่งออกจากโหมดเศร้ามา ตบสติหน่อยดิ แซะได้เต็มที่" });
                }}
                title="ปิดฉากเศร้าแล้วไปโดนแซะต่อ"
              >
                <Flame size={16} />
                แซะอีกดิ๊
              </button>
            </div>
          )}
        </div>

        <label className="fade-up inline-flex cursor-pointer items-center gap-2 text-xs text-muted" style={{ animationDelay: "0.7s" }}>
          <input
            type="checkbox"
            checked={state.autoplayMusic}
            onChange={() => dispatch({ type: "TOGGLE_AUTOPLAY" })}
            className="h-4 w-4 accent-[#F472B6]"
          />
          ครั้งหน้าเข้าโหมดเศร้าแล้วลองเปิดเพลงอัตโนมัติ (ถ้าเบราว์เซอร์อนุญาต)
        </label>

        <div className="fade-up flex flex-wrap justify-center gap-2.5" style={{ animationDelay: "0.8s" }}>
          {state.musicOpen && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                dispatch({ type: "SET_MODE", mode: "savage" });
                dispatch({ type: "SET_HEARTBREAK", value: false });
                dispatch({ type: "SET_PENDING_ASK", text: "เพิ่งออกจากโหมดเศร้ามา ตบสติหน่อยดิ แซะได้เต็มที่" });
              }}
            >
              <Flame size={16} />
              แซะอีกดิ๊
            </button>
          )}
          <button
            className="btn btn-outline-accent"
            onClick={() => {
              dispatch({ type: "SET_MODE", mode: "normal" });
              dispatch({ type: "SET_HEARTBREAK", value: false });
            }}
          >
            <Sunrise size={16} />
            พอแล้ว จะมูฟออนแล้ว
          </button>
          <button className="btn btn-primary" onClick={() => dispatch({ type: "RESET_ALL" })}>
            <RefreshCw size={16} />
            ลองกับคนใหม่ 💀
          </button>
        </div>

        <p className="text-[0.68rem] text-muted/70">เพลงจะไม่เปิดเองจนกว่าจะกด (หรือติ๊กอนุญาตไว้) สบายใจได้</p>
      </div>
    </div>
  );
}
