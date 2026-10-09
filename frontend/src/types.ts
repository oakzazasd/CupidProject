export type Page = "home" | "analyze" | "settings";
export type Mode = "normal" | "savage" | "heartbreak";
export type OrbState = "idle" | "analyzing" | "responding" | "heartbreak" | "error";

export interface InterestItem {
  topic: string;
  note?: string;
}

export interface Report {
  score: number;
  verdict: string;
  summary: string;
  shared_interests: InterestItem[];
  conversation_starters: string[];
  flirting_tips: string[];
  next_step: string;
  score_explanation: string;
  confidence: "low" | "medium" | "high";
  roast: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export interface RelationshipInfo {
  status: string;
  frequency: string;
  initiator: string;
  goal: string;
  myPersonality: string;
  theirPersonality: string;
}

export interface AppConfig {
  configured: boolean;
  visionConfigured: boolean;
  provider: { name: string; baseUrl: string };
  models: { vision: string | null; text: string | null };
  sadMusic: { youtubeId: string | null; fallbackUrl: string };
}

export interface AnalyzeResponse {
  report: Report;
  meta: { usedVision: boolean };
}

export interface ChatResponse {
  reply: string;
}

export interface TestConnectionResponse {
  ok: boolean;
  latencyMs?: number;
  code?: string;
  message: string;
}
