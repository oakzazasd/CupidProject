import { MessageSquareText, Users } from "lucide-react";
import { useApp } from "../state/appState";
import type { RelationshipInfo } from "../types";

const SELECT_FIELDS: { key: keyof RelationshipInfo; label: string; options: string[] }[] = [
  {
    key: "status",
    label: "ตอนนี้สองคนเป็นอะไรกัน",
    options: ["แทบไม่รู้จักกัน", "รู้จักกันบ้าง", "เพื่อนกัน", "เพื่อนสนิท", "คุยกันบ่อยแต่ยังไม่เป็นอะไร"],
  },
  {
    key: "frequency",
    label: "คุยกันบ่อยแค่ไหน",
    options: ["แทบไม่คุย", "นาน ๆ ครั้ง", "เป็นบางครั้ง", "คุยกันบ่อย", "คุยกันทุกวัน"],
  },
  {
    key: "initiator",
    label: "ใครทักก่อนเป็นส่วนใหญ่",
    options: ["ฉันทักก่อนเสมอ 💀", "สลับกัน", "เขาทักก่อนบ่อยกว่า", "ไม่แน่ใจ"],
  },
  {
    key: "goal",
    label: "เป้าหมายของคุณคือ",
    options: ["อยากจีบให้ได้", "อยากรู้จักเขามากขึ้น", "เช็กใจตัวเองว่าควรไปต่อไหม", "มาลองเล่น ๆ หาอะไรทำ"],
  },
];

export function RelationshipForm() {
  const { state, dispatch } = useApp();
  const r = state.relationship;

  return (
    <div className="glass p-5 sm:p-6">
      <h3 className="section-title mb-1">
        <Users size={18} className="text-neocyan" />
        ข้อมูลความสัมพันธ์ (ไม่บังคับ ข้ามได้หมด)
      </h3>
      <p className="mb-5 text-xs leading-relaxed text-muted">
        ยิ่งเล่าเยอะ AI ยิ่งแซะ—จะแปลว่า "วิเคราะห์" ได้แม่นขึ้นนะ ไม่ต้องใส่ชื่อใครเลย
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SELECT_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">{f.label}</span>
            <select
              className="field"
              value={r[f.key]}
              onChange={(e) => dispatch({ type: "SET_REL", key: f.key, value: e.target.value })}
            >
              <option value="">ไม่บอกก็ได้</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">นิสัยของคุณสั้น ๆ</span>
          <input
            className="field"
            placeholder="เช่น ขี้อาย แต่ขี้เล่นกับคนสนิท"
            value={r.myPersonality}
            maxLength={300}
            onChange={(e) => dispatch({ type: "SET_REL", key: "myPersonality", value: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">นิสัยเขา (ตามที่คุณเห็น)</span>
          <input
            className="field"
            placeholder="เช่น ใจดี ชอบหยิบขนมมาแบ่ง"
            value={r.theirPersonality}
            maxLength={300}
            onChange={(e) => dispatch({ type: "SET_REL", key: "theirPersonality", value: e.target.value })}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
          <MessageSquareText size={14} />
          สัญญาณหรือเรื่องเล่าที่อยากให้วิเคราะห์ (จุดนี้สำคัญสุด)
        </span>
        <textarea
          className="field min-h-[110px] resize-y"
          placeholder="เช่น ทักไปเมื่อวันจันทร์ เขาอ่านแล้วเงียบไปเลย... แต่เมื่อวานเขากดไลก์สตอรี่กลับมา แปลว่าไรวะ"
          value={state.interactionNotes}
          maxLength={1500}
          onChange={(e) => dispatch({ type: "SET_NOTES", value: e.target.value })}
        />
        <span className="mt-1 block text-right text-[0.68rem] text-muted">
          {state.interactionNotes.length}/1500
        </span>
      </label>
    </div>
  );
}
