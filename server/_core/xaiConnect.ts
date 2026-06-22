import { getToken } from "@vercel/connect";
import type { Message } from "./llm";

/**
 * Talk to the real Grok (x.ai) API using a short-lived token minted by
 * Vercel Connect.
 *
 * Vercel Connect exchanges the deployment's identity (or an explicit Vercel
 * access token when running outside a Vercel environment) for a scoped token
 * for the connected x.ai provider. That token is sent as a `Bearer` credential
 * to x.ai's OpenAI-compatible chat-completions endpoint.
 *
 * Environment variables:
 *   XAI_CONNECTOR     – Connect connector id (default "console.x.ai/cinnabar-kettle")
 *   XAI_SCOPES        – comma-separated Connect scopes (optional)
 *   XAI_API_BASE_URL  – x.ai API base (default "https://api.x.ai/v1")
 *   XAI_MODEL         – default model (default "grok-3")
 *   VERCEL_TOKEN      – Vercel access token; only needed off-Vercel (CI / local).
 *   XAI_API_KEY       – optional direct x.ai key used as a fallback when Vercel
 *                       Connect is not configured.
 */
const XAI = {
  connector: process.env.XAI_CONNECTOR ?? "console.x.ai/cinnabar-kettle",
  scopes: (process.env.XAI_SCOPES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  apiBaseUrl: process.env.XAI_API_BASE_URL ?? "https://api.x.ai/v1",
  model: process.env.XAI_MODEL ?? "grok-3",
  vercelToken: process.env.VERCEL_TOKEN ?? "",
  apiKey: process.env.XAI_API_KEY ?? "",
};

/**
 * True when Grok-via-x.ai is configured. We can reach x.ai either through a
 * Vercel Connect token (on Vercel via OIDC, or off-Vercel with VERCEL_TOKEN +
 * a connector) or with a direct XAI_API_KEY.
 */
export function isXaiConfigured(): boolean {
  if (XAI.apiKey) return true;
  // On Vercel an OIDC identity is available, so a connector alone is enough.
  if (XAI.connector && (XAI.vercelToken || process.env.VERCEL)) return true;
  return false;
}

/** Resolve a Bearer credential for x.ai: prefer Vercel Connect, fall back to a direct key. */
async function resolveXaiBearer(): Promise<string> {
  if (XAI.connector && (XAI.vercelToken || process.env.VERCEL)) {
    const params = {
      subject: { type: "app" as const },
      ...(XAI.scopes.length ? { scopes: XAI.scopes } : {}),
    };
    return XAI.vercelToken
      ? getToken(XAI.connector, params, { vercelToken: XAI.vercelToken })
      : getToken(XAI.connector, params);
  }
  if (XAI.apiKey) return XAI.apiKey;
  throw new Error("x.ai is not configured (set XAI_CONNECTOR/VERCEL_TOKEN or XAI_API_KEY)");
}

type XaiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

/**
 * Call Grok's chat-completions endpoint and return the assistant text.
 */
export async function invokeGrokChat(args: {
  messages: Message[];
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const token = await resolveXaiBearer();
  const url = `${XAI.apiBaseUrl.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: args.model || XAI.model,
      messages: args.messages,
      max_tokens: args.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Grok (x.ai) request failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as XaiChatResponse;
  return data.choices?.[0]?.message?.content ?? "";
}
