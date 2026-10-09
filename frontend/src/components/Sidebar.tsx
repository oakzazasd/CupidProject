import { useState } from "react";
import { Heart, Home, Menu, Settings, Sparkles, X } from "lucide-react";
import { useApp } from "../state/appState";
import type { Page } from "../types";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="rgba(18,23,42,0.9)" stroke="rgba(148,163,184,0.25)" />
      <ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#22D3EE" strokeWidth="1.2" opacity="0.8" />
      <ellipse
        cx="20"
        cy="20"
        rx="15"
        ry="6"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="1.2"
        opacity="0.6"
        transform="rotate(60 20 20)"
      />
      <path
        d="M20 27.5c-4.6-3.4-7.5-6-7.5-9.5a4.2 4.2 0 017.5-2.6 4.2 4.2 0 017.5 2.6c0 3.5-2.9 6.1-7.5 9.5z"
        fill="#F472B6"
      />
    </svg>
  );
}

const NAV: { page: Page; label: string; icon: typeof Home }[] = [
  { page: "home", label: "หน้าหลัก", icon: Home },
  { page: "analyze", label: "วิเคราะห์ครั้งใหม่", icon: Sparkles },
  { page: "settings", label: "ตั้งค่า", icon: Settings },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { state, dispatch } = useApp();
  return (
    <nav className="flex flex-col gap-1.5" aria-label="เมนูหลัก">
      {NAV.map(({ page, label, icon: Icon }) => {
        const active = state.page === page;
        return (
          <button
            key={page}
            onClick={() => {
              dispatch({ type: "SET_PAGE", page });
              onNavigate?.();
            }}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-soft text-white border border-accent/40"
                : "text-ink-muted hover:bg-white/5 hover:text-ink border border-transparent"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function SessionBadge() {
  return (
    <div className="mt-auto glass-subtle p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
        <span
          className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
        เซสชันชั่วคราว
      </div>
      <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
        ไม่มีการบันทึกอะไรทั้งนั้น รีเฟรช = เริ่มใหม่ Cupid AI ไม่จำใคร (แบบเชิงเทคนิค)
      </p>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { state, dispatch } = useApp();

  const brand = (
    <button
      onClick={() => {
        dispatch({ type: "SET_PAGE", page: "home" });
        setOpen(false);
      }}
      className="flex items-center gap-3 rounded-xl px-1 py-1 text-left"
      aria-label="Cupid AI — ไปหน้าหลัก"
    >
      <LogoMark />
      <span>
        <span className="block text-[1.05rem] font-extrabold tracking-wide">
          Cupid <span className="text-romance">AI</span>
        </span>
        <span className="block text-[0.68rem] font-medium tracking-widest text-muted uppercase">
          Love Command Center
        </span>
      </span>
    </button>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col gap-6 border-r border-white/10 bg-night-950/80 p-5 backdrop-blur-xl lg:flex">
        {brand}
        <NavItems />
        {state.report && (
          <div className="glass-subtle px-4 py-3 text-xs text-muted">
            ผลวิเคราะห์ล่าสุด:{" "}
            <span className="font-bold text-romance">{state.report.score}%</span>
          </div>
        )}
        <SessionBadge />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-night-950/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="text-base font-extrabold">
            Cupid <span className="text-romance">AI</span>
          </span>
        </div>
        <button
          className="btn btn-ghost !px-3 !py-2"
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
        >
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col gap-6 border-r border-white/10 bg-night-950/95 p-5 backdrop-blur-xl fade-up">
            <div className="flex items-center justify-between">
              {brand}
              <button className="btn btn-ghost !px-2.5 !py-2" onClick={() => setOpen(false)} aria-label="ปิดเมนู">
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <SessionBadge />
          </div>
        </div>
      )}
    </>
  );
}

export function HeartCrack({ className = "" }: { className?: string }) {
  return <Heart size={16} className={className} aria-hidden="true" />;
}
