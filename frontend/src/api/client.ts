import type {
  AnalyzeResponse,
  AppConfig,
  ChatResponse,
  RelationshipInfo,
  TestConnectionResponse,
} from "../types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const FALLBACK_THAI: Record<string, string> = {
  network: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่นะ",
  timeout: "การเชื่อมต่อใช้เวลานานเกินไป ลองอีกครั้งได้เลย",
  server_error: "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้งภายหลัง",
};

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 120000);
  try {
    const res = await fetch(BASE + path, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = data?.error;
      if (!err) {
        throw new ApiError(
          "network",
          "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ (backend อาจยังไม่เปิดหรือหยุดทำงาน) — ให้แอดมินเช็ก terminal ของ backend แล้วลองใหม่"
        );
      }
      throw new ApiError(err.code ?? "server_error", err.message ?? FALLBACK_THAI.server_error);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError("timeout", FALLBACK_THAI.timeout);
    }
    throw new ApiError("network", FALLBACK_THAI.network);
  } finally {
    clearTimeout(timer);
  }
}

export interface AnalyzePayload {
  userPhoto?: string;
  crushPhoto?: string;
  myInterests: string[];
  theirInterests: string[];
  matchedInterests: string[];
  relationship: RelationshipInfo;
  interactionNotes: string;
}

export interface ChatPayload {
  mode: string;
  messages: { role: "user" | "assistant"; content: string }[];
  reportContext: {
    score?: number;
    verdict?: string;
    summary?: string;
    sharedInterests: { topic: string }[];
  } | null;
}

export const api = {
  getConfig: () => request<AppConfig>("/api/config", { timeoutMs: 15000 }),
  testConnection: () =>
    request<TestConnectionResponse>("/api/test-connection", {
      body: {},
      timeoutMs: 120000,
    }),
  analyze: (payload: AnalyzePayload) =>
    request<AnalyzeResponse>("/api/analyze", { body: payload, timeoutMs: 150000 }),
  chat: (payload: ChatPayload) =>
    request<ChatResponse>("/api/chat", { body: payload, timeoutMs: 60000 }),
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return FALLBACK_THAI.server_error;
}

export function errorCode(e: unknown): string {
  return e instanceof ApiError ? e.code : "server_error";
}