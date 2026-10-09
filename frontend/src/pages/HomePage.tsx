import { ArrowRight, FlaskConical, Lock, Music4, Skull, Sparkles } from "lucide-react";
import { useApp } from "../state/appState";
import { AICore } from "../components/AICore";
import type { OrbState } from "../types";

interface HomePageProps {
  orbState: OrbState;
}

export function HomePage({ orbState }: HomePageProps) {
  const { state, dispatch } = useApp();

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8 sm:py-12">
      <section className="flex flex-col items-center gap-6 text-center fade-up">
        <AICore size={240} state={orbState} />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Cupid <span className="text-romance">AI</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-8 text-muted sm:text-base">
            ผู้ช่วยวิเคราะห์ความรักจากอวกาศ — ฉลาด ไร้ปรานี และขี้แซะเล็กน้อย
            <br />
            อัปโหลดรูป เลือกสิ่งที่ชอบ แล้วให้ AI คำนวณความหวังของหัวใจคุณ (เพื่อความบันเทิงล้วน ๆ
            มันอ่านใจคนไม่ออกจากหน้าตา จริง ๆ)
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="btn btn-primary !px-6 !py-3 text-base"
            onClick={() => dispatch({ type: "SET_PAGE", page: "analyze" })}
          >
            <Sparkles size={19} />
            เริ่มวิเคราะห์ 💘
          </button>
          <button
            className="btn btn-ghost !px-6 !py-3 text-base"
            onClick={() => dispatch({ type: "SET_PAGE", page: "settings" })}
          >
            <FlaskConical size={18} />
            ดูตั้งค่า
          </button>
        </div>
        {!state.config?.configured && state.configLoaded && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-xs leading-relaxed text-amber-200">
            ยังไม่ได้ตั้งค่า AI Provider — ให้แอดมินไปตั้งค่าที่หน้า "ตั้งค่า" ก่อน แล้วค่อยมาวิเคราะห์กัน
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: "คะแนนความเข้ากันได้",
            desc: "เปอร์เซ็นต์ฮา ๆ พร้อมคำตัดสินที่ฟังดูเหมือนเพื่อนสนิทกำลังจับพลาด",
            color: "text-romance",
          },
          {
            icon: Skull,
            title: "โหมดแซะ / ตบสติ",
            desc: "อยากโดนแซะก็มี อยากโดนตบสติพร้อมเอฟเฟกต์ฝนตกก็มี ครบจบในที่เดียว",
            color: "text-neocyan",
          },
          {
            icon: Music4,
            title: "เพลงเศร้าพร้อมเล่น",
            desc: "เมื่อความรักไม่เป็นไปตามแผน มีเพลงเศร้าประกอบฉากให้เสียใจอย่างมีสไตล์",
            color: "text-indigo-300",
          },
        ].map((f, i) => (
          <div key={f.title} className="glass p-5 fade-up" style={{ animationDelay: `${i * 120}ms` }}>
            <f.icon size={22} className={`${f.color} mb-2`} />
            <h3 className="font-bold">{f.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="glass p-6 fade-up">
        <h2 className="mb-4 text-center text-lg font-extrabold">ใช้งานยังไง (ง่ายมาก)</h2>
        <ol className="mx-auto max-w-xl space-y-3">
          {[
            "อัปโหลดรูปตัวเอง + รูปคนที่แอบชอบ (หรือข้ามไปเลยก็ได้)",
            "เลือกสิ่งที่ชอบ + เล่าเรื่องสัญญาณที่เจอมาให้ฟังหน่อย",
            "กดวิเคราะห์ แล้วเตรียมใจรับคำตัดสิน",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-xs font-extrabold text-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-center gap-2 pb-4 text-center fade-up">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Lock size={13} className="text-emerald-400" />
          ไม่มีสมัครสมาชิก ไม่มีการเก็บรูป ไม่มีประวัติแชต — รีเฟรชแล้วทุกอย่างหายเหมือนความรู้สึกของเขา
        </p>
        <button
          className="text-xs font-semibold text-neocyan underline-offset-4 hover:underline"
          onClick={() => dispatch({ type: "SET_PAGE", page: "analyze" })}
        >
          เอาละ ยอมรับความเสี่ยง <ArrowRight size={12} className="inline" />
        </button>
      </section>
    </div>
  );
}
