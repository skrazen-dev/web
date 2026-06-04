import { describe, expect, it } from "vitest";
import { COOKIE_NAME } from "@shared/const";
import { extractSessionToken } from "./token";

describe("extractSessionToken", () => {
  it("reads Bearer token from Authorization header", () => {
    const req = {
      headers: { authorization: "Bearer my.jwt.token" },
    } as Parameters<typeof extractSessionToken>[0];

    expect(extractSessionToken(req)).toBe("my.jwt.token");
  });

  it("falls back to session cookie", () => {
    const req = {
      headers: { cookie: `${COOKIE_NAME}=cookie.jwt.token` },
    } as Parameters<typeof extractSessionToken>[0];

    expect(extractSessionToken(req)).toBe("cookie.jwt.token");
  });

  it("prefers Bearer over cookie", () => {
    const req = {
      headers: {
        authorization: "Bearer header.token",
        cookie: `${COOKIE_NAME}=cookie.token`,
      },
    } as Parameters<typeof extractSessionToken>[0];

    expect(extractSessionToken(req)).toBe("header.token");
  });
});