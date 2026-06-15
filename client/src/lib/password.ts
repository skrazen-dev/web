/**
 * Password hashing helper shared by the login gate and the user-management UI.
 * We only ever persist/compare SHA-256 digests — plaintext passwords are never
 * stored in the app state or source.
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
