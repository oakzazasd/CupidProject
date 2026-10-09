import { useEffect, useRef, useState } from "react";
import { scoreCaption } from "../lib/fun";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

interface ScoreRevealProps {
  score: number;
  verdict: string;
}

const R = 84;
const CIRC = 2 * Math.PI * R;

export function ScoreReveal({ score, verdict }: ScoreRevealProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? score : 0);
  const [armed, setArmed] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(score);
      setArmed(true);
      return;
    }
    const start = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(score * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const timer = setTimeout(() => setArmed(true), 120);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, [score, reduced]);

  const hue = score >= 60 ? "#F472B6" : score >= 35 ? "#22D3EE" : "#818CF8";

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className={`relative ${reduced ? "" : "score-glow"}`}>
        <svg width="208" height="208" viewBox="0 0 208 208" role="img" aria-label={`คะแนนความเข้ากันได้ ${score} เปอร์เซ็นต์`}>
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={hue} />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="104" cy="104" r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="10" />
          <circle
            className="score-ring-circle"
            cx="104"
            cy="104"
            r={R}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={armed ? CIRC * (1 - score / 100) : CIRC}
            transform="rotate(-90 104 104)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold tabular-nums" style={{ color: hue }}>
            {display}
            <span className="text-2xl">%</span>
          </span>
          <span className="mt-1 text-[0.68rem] font-semibold tracking-widest text-muted uppercase">
            Love Score
          </span>
        </div>
      </div>
      <p className="max-w-md text-center text-lg font-extrabold leading-relaxed">{verdict}</p>
      <p className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-muted">
        {scoreCaption(score)}
      </p>
    </div>
  );
}
