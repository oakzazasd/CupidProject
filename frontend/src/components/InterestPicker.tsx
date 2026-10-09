import { useMemo, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { INTEREST_CATEGORIES } from "../lib/interestsData";
import { useApp } from "../state/appState";

type Side = "my" | "their";

export function InterestPicker() {
  const { state, dispatch } = useApp();
  const [side, setSide] = useState<Side>("my");
  const [activeCat, setActiveCat] = useState(INTEREST_CATEGORIES[0].id);
  const [custom, setCustom] = useState("");

  const active = side === "my" ? state.myInterests : state.theirInterests;
  const other = side === "my" ? state.theirInterests : state.myInterests;

  const matched = useMemo(
    () => state.myInterests.filter((x) => state.theirInterests.includes(x)),
    [state.myInterests, state.theirInterests]
  );

  const cat = INTEREST_CATEGORIES.find((c) => c.id === activeCat) ?? INTEREST_CATEGORIES[0];

  function toggle(name: string) {
    dispatch({ type: "TOGGLE_INTEREST", side, name });
  }

  function addCustom() {
    const name = custom.trim().slice(0, 60);
    if (!name) return;
    if (!active.includes(name)) dispatch({ type: "TOGGLE_INTEREST", side, name });
    setCustom("");
  }

  return (
    <div className="glass p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="section-title">
          <Sparkles size={18} className="text-neocyan" />
          สิ่งที่ชอบ — เลือกให้ Cupid AI ช่วยหาจุดตรงกัน
        </h3>
        <div className="flex rounded-xl border border-white/10 bg-night-900/60 p-1" role="tablist">
          <button
            role="tab"
            aria-selected={side === "my"}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              side === "my" ? "bg-accent-soft text-white" : "text-muted hover:text-ink"
            }`}
            onClick={() => setSide("my")}
          >
            ฉันชอบ ({state.myInterests.length})
          </button>
          <button
            role="tab"
            aria-selected={side === "their"}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              side === "their" ? "bg-accent-soft text-white" : "text-muted hover:text-ink"
            }`}
            onClick={() => setSide("their")}
          >
            เขาชอบ ({state.theirInterests.length})
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {INTEREST_CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = c.id === activeCat;
          return (
            <button
              key={c.id}
              className={`chip ${isActive ? (side === "my" ? "chip-on" : "chip-cyan-on") : ""}`}
              onClick={() => setActiveCat(c.id)}
              aria-pressed={isActive}
            >
              <Icon size={14} />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {cat.items.map((item, i) => {
          const on = active.includes(item);
          const isMatch = on && other.includes(item);
          return (
            <button
              key={item}
              className={`chip tag-in ${on ? (side === "my" ? "chip-on" : "chip-cyan-on") : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => toggle(item)}
              aria-pressed={on}
            >
              {isMatch && "💘"}
              {item}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex gap-2">
        <input
          className="field flex-1"
          placeholder="พิมพ์สิ่งที่ชอบเอง เช่น ดูพระอาทิตย์ตก..."
          value={custom}
          maxLength={60}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button className="btn btn-ghost" onClick={addCustom} aria-label="เพิ่มสิ่งที่ชอบเอง">
          <Plus size={16} />
          เพิ่มเอง
        </button>
      </div>

      {active.length > 0 && (
        <div className="glass-subtle p-3.5">
          <p className="mb-2 text-xs font-semibold text-muted">
            {side === "my" ? "สิ่งที่คุณเลือกไว้:" : "สิ่งที่เขาชอบ (ตามที่คุณรู้):"}
          </p>
          <div className="flex flex-wrap gap-2">
            {active.map((name) => (
              <button
                key={name}
                className="chip chip-on !normal-case"
                onClick={() => toggle(name)}
                aria-label={`ลบ ${name}`}
              >
                {name}
                <X size={13} />
              </button>
            ))}
          </div>
        </div>
      )}

      {matched.length > 0 ? (
        <div className="mt-4 rounded-xl border border-romance/40 bg-romance/10 p-4">
          <p className="text-sm font-bold text-romance">
            💘 ตรงกันแล้ว {matched.length} อย่าง!
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {matched.map((m, i) => (
              <span
                key={m}
                className="tag-in rounded-full border border-romance/50 bg-romance/15 px-3 py-1 text-xs font-semibold text-romance"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          ไม่รู้ว่าเขาชอบอะไรก็ไม่เป็นไร ข้ามได้ — หรือเดี๋ยว AI จะเดาจากเรื่องที่เล่าให้ฟัง
        </p>
      )}
    </div>
  );
}
