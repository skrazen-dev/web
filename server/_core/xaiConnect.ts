import { getToken } from "@vercel/connect";

/**
 * Server-side helper for calling the x.ai (Grok) console API using a
 * short-lived, scoped access token minted by Vercel Connect.
 *
 * Vercel Connect exchanges the deployment's identity (or an explicit Vercel
 * access token when running outside of a Vercel environment) for a scoped
 * token that can be sent as a `Bearer` credential to the connected provider.
 *
 * Required environment variables:
 *   XAI_CONNECTOR        – Connect connector id (e.g. "console.x.ai/cinnabar-kettle")
 *   XAI_API_BASE_URL     – Base URL for the x.ai console API (optional, has a default)
 *   VERCEL_TOKEN         – Vercel access token, only needed outside of Vercel
 *                          (CI, local dev). On Vercel the OIDC identity is used.
 */
const XAI_CONFIG = {
  connector: process.env.XAI_CONNECTOR ?? "console.x.ai/cinnabar-kettle",
  apiBaseUrl: process.env.XAI_API_BASE_URL ?? "https://console.x.ai/api",
  // Optional: only used when running outside of a Vercel deployment.
  vercelToken: process.env.VERCEL_TOKEN ?? "",
};

/**
 * Mint a scoped access token for the x.ai connector.
 *
 * @param scopes Connect scopes to request for this token.
 */
export async function getXaiAccessToken(scopes: string[]): Promise<string> {
  if (!XAI_CONFIG.connector) {
    throw new Error("XAI_CONNECTOR is not configured");
  }

  if (scopes.length === 0) {
    throw new Error("At least one scope is required to mint an x.ai token");
  }

  // The third `options` argument is only required when an OIDC identity is
  // not available (e.g. CI or local development); pass it through when a
  // Vercel access token has been provided.
  return XAI_CONFIG.vercelToken
    ? getToken(
        XAI_CONFIG.connector,
        { subject: { type: "app" }, scopes },
        { vercelToken: XAI_CONFIG.vercelToken }
      )
    : getToken(XAI_CONFIG.connector, { subject: { type: "app" }, scopes });
}

export type XaiRequestOptions = {
  /** API path relative to the configured base URL, e.g. "/some-endpoint". */
  path: string;
  /** HTTP method. Defaults to "GET". */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Connect scopes required for this call. */
  scopes: string[];
  /** Optional JSON request body. */
  body?: unknown;
  /** Optional extra headers. */
  headers?: Record<string, string>;
};

/**
 * Call the x.ai console API with a freshly-minted scoped token.
 *
 * @returns The parsed JSON response.
 */
export async function callXaiApi<T = unknown>(
  options: XaiRequestOptions
): Promise<T> {
  const { path, method = "GET", scopes, body, headers } = options;

  const token = await getXaiAccessToken(scopes);
  const url = `${XAI_CONFIG.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `x.ai API request failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as T;
}
