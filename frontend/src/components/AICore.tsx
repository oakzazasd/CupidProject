import { useId, useMemo } from "react";
import type { OrbState } from "../types";

interface AICoreProps {
  size?: number;
  state: OrbState;
  className?: string;
}

const ORB_LABEL: Record<OrbState, string> = {
  idle: "Cupid AI พร้อมทำงาน",
  analyzing: "Cupid AI กำลังวิเคราะห์",
  responding: "Cupid AI กำลังพิมพ์คำตอบ",
  heartbreak: "Cupid AI โหมดเศร้า",
  error: "Cupid AI ขัดข้อง",
};

export function AICore({ size = 220, state, className = "" }: AICoreProps) {
  const uid = useId().replace(/:/g, "");
  const gCore = `core-${uid}`;
  const gHalo = `halo-${uid}`;
  const gRing = `ring-${uid}`;

  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        dur: 14 + i * 3.7,
        delay: -i * 2.4,
        r: 90 + (i % 3) * 16,
        size: 2.2 + (i % 3) * 0.7,
        rev: i % 2 === 0,
      })),
    []
  );

  return (
    <div
      className={`ai-core ai-core--${state} ${className}`}
      style={{ ["--orb-size" as string]: `${size}px` }}
      role="img"
      aria-label={ORB_LABEL[state]}
    >
      <svg viewBox="0 0 300 300" focusable="false">
        <defs>
          <radialGradient id={gCore} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gHalo} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={gRing} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        <circle className="orb-halo" cx="150" cy="150" r="145" fill={`url(#${gHalo})`} />
        <circle cx="150" cy="150" r="132" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />

        <g className="orb-spin" style={{ ["--spin-dur" as string]: "26s" }}>
          <circle
            cx="150"
            cy="150"
            r="118"
            fill="none"
            stroke={`url(#${gRing})`}
            strokeWidth="1.6"
            strokeDasharray="72 34"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
        <g className="orb-spin orb-spin--rev" style={{ ["--spin-dur" as string]: "36s" }}>
          <ellipse
            cx="150"
            cy="150"
            rx="132"
            ry="50"
            fill="none"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="1.2"
          />
        </g>
        <g className="orb-spin" style={{ ["--spin-dur" as string]: "48s" }}>
          <ellipse
            cx="150"
            cy="150"
            rx="106"
            ry="84"
            fill="none"
            stroke="rgba(139,92,246,0.32)"
            strokeWidth="1.2"
          />
        </g>

        {particles.map((p, i) => (
          <g
            key={i}
            className={`orb-spin ${p.rev ? "orb-spin--rev" : ""}`}
            style={{
              ["--spin-dur" as string]: `${p.dur}s`,
              ["--spin-delay" as string]: `${p.delay}s`,
            }}
          >
            <circle className="orb-particle" cx={150 + p.r} cy="150" r={p.size} />
          </g>
        ))}

        <circle className="orb-core" cx="150" cy="150" r="72" fill={`url(#${gCore})`} />
        <circle cx="150" cy="150" r="52" fill={`url(#${gCore})`} opacity="0.9" />
        <circle className="orb-core-inner" cx="150" cy="150" r="26" />
      </svg>
    </div>
  );
}
