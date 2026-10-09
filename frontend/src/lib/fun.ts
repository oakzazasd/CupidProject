export function scoreCaption(score: number): string {
  if (score >= 90) return "เตรียมตัดชุดแต่งงานได้เลย (ใจเย็น ๆ ก่อน นี่คือคะแนนความบันเทิง)";
  if (score >= 75) return "มีทรงว่ะ ลุยเบา ๆ";
  if (score >= 60) return "น่าสนใจนะ แต่อย่าเพิ่งตื่นเต้น";
  if (score >= 45) return "ครึ่งใจครึ่งกรรม";
  if (score >= 30) return "เขาอาจเหมาะเป็นเพื่อนมากกว่า (ตอนนี้นะ)";
  if (score >= 15) return "ชักจะเป็นยากำสมองแล้วว่ะ";
  return "ชอบเขาจริง ๆ หรือชอบความลำบาก 💀";
}

export function confidenceLabel(confidence: string): string {
  if (confidence === "high") return "ข้อมูลแน่นพอสมควร";
  if (confidence === "medium") return "พอมีข้อมูล แต่ยังไม่ชัวร์";
  return "ข้อมูลยังน้อย ยังสรุปอะไรชัด ๆ ไม่ได้";
}

export const ANALYZE_STEPS = [
  "กำลังปลุก Cupid AI ให้ตื่น...",
  "กำลังอ่านสัญญาณความรัก...",
  "กำลังคิดมุก...",
  "กำลังคำนวณความหวัง...",
  "เกือบแล้ว อย่าใจเร็ว...",
];

export const SUGGESTED_QUESTIONS = [
  "มีโอกาสไหม?",
  "ควรทักว่าอะไรดี?",
  "เขาตอบแค่ '555' แปลว่าไร?",
  "เราชอบเกมเหมือนกัน ชวนทำอะไรดี?",
  "อธิบายคะแนนหน่อย",
  "แซะหน่อยดิ",
];

export const CHAT_MODE_LABEL: Record<string, string> = {
  normal: "โหมดเพื่อนซี้ใจดี",
  savage: "โหมดแซะไม่ยั้ง",
  heartbreak: "โหมดเศร้า 🥀",
};
