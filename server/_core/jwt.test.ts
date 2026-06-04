import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./jwt";

describe("jwt session tokens", () => {
  it("round-trips userId and openId", async () => {
    const token = await signSessionToken({ userId: 7, openId: "test-open-id" });
    const payload = await verifySessionToken(token);

    expect(payload).toEqual({ userId: 7, openId: "test-open-id" });
  });

  it("returns null for invalid tokens", async () => {
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
  });
});