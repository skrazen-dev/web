/**
 * Vercel AI Gateway client (OpenAI-compatible chat completions).
 *
 * ใช้ AI_GATEWAY_API_KEY ตัวเดียวเรียกได้ทั้ง xAI Grok และ Claude ผ่าน gateway
 * โดยไม่ต้องจัดการ key ของแต่ละ provider แยกกัน
 *
 *   const text = await gatewayChat({
 *     model: "xai/grok-4",
 *     messages: [{ role: "user", content: "..." }],
 *   });
 */
import { ENV } from "./env";

export type GatewayRole = "system" | "user" | "assistant";

/** ส่วนของ message แบบ multimodal (รองรับรูปสำหรับ OCR) */
export type GatewayContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

export type GatewayMessage = {
  role: GatewayRole;
  content: string | GatewayContentPart[];
};

export type GatewayChatOptions = {
  messages: GatewayMessage[];
  /** เช่น "xai/grok-4", "xai/grok-3-mini", "anthropic/claude-sonnet-4-6" */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** ขอผลลัพธ์เป็น JSON object ล้วน */
  jsonMode?: boolean;
};

const DEFAULT_MODEL = "xai/grok-4";

type ChatCompletionResponse = {
  choices: Array<{
    message: { role: string; content: string | null };
    finish_reason: string | null;
  }>;
};

function assertConfigured() {
  if (!ENV.aiGatewayApiKey) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not configured — ตั้งค่า secret ก่อนใช้ฟีเจอร์ AI"
    );
  }
}

/** เรียก gateway แล้วคืน text content ของ assistant */
export async function gatewayChat(
  options: GatewayChatOptions
): Promise<string> {
  assertConfigured();

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_MODEL,
    messages: options.messages,
  };
  if (typeof options.maxTokens === "number") body.max_tokens = options.maxTokens;
  if (typeof options.temperature === "number")
    body.temperature = options.temperature;
  if (options.jsonMode) body.response_format = { type: "json_object" };

  const url = `${ENV.aiGatewayBaseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.aiGatewayApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AI Gateway request failed: ${res.status} ${res.statusText} – ${errText}`
    );
  }

  const json = (await res.json()) as ChatCompletionResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI Gateway returned an empty response");
  }
  return content;
}

/**
 * เรียก gateway โดยบังคับ JSON mode แล้ว parse เป็น object
 * ถ้า parse ไม่ได้จะ throw เพื่อให้ caller จัดการ fallback
 */
export async function gatewayJSON<T = unknown>(
  options: Omit<GatewayChatOptions, "jsonMode">
): Promise<T> {
  const raw = await gatewayChat({ ...options, jsonMode: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // เผื่อโมเดลห่อ JSON ด้วย markdown code fence
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`AI Gateway returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

export function isAIGatewayConfigured(): boolean {
  return ENV.aiGatewayApiKey.length > 0;
}
