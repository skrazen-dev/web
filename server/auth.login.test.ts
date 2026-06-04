import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import * as authModule from "./_core/auth";
import * as dbModule from "./db";
import { hashPassword } from "./_core/password";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createGuestContext(): { ctx: TrpcContext; cookies: CookieCall[] } {
  const cookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("auth.login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns user on successful login", async () => {
    vi.spyOn(authModule, "loginWithCredentials").mockResolvedValue({
      success: true,
      token: "eyJhbGciOiJIUzI1NiJ9.test",
      user: {
        id: 1,
        openId: "user-1",
        email: "user@example.com",
        name: "Test User",
        role: "user",
        loginMethod: "jwt",
      },
    });

    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("user@example.com");
    expect(authModule.loginWithCredentials).toHaveBeenCalledWith(
      { email: "user@example.com", password: "password123" },
      ctx.req,
      ctx.res,
    );
  });

  it("rejects invalid credentials", async () => {
    vi.spyOn(authModule, "loginWithCredentials").mockResolvedValue({
      success: false,
      error: "Invalid email or password",
    });

    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "wrong@example.com",
        password: "wrongpass1",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  });
});

describe("auth.login integration (jwt)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("signs JWT and sets session cookie when credentials are valid", async () => {
    const hash = hashPassword("securepass1");

    vi.spyOn(dbModule, "getUserByEmail").mockResolvedValue({
      id: 42,
      openId: "jwt-user",
      email: "jwt@example.com",
      name: "JWT User",
      passwordHash: hash,
      loginMethod: "jwt",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    vi.spyOn(dbModule, "touchUserLastSignedIn").mockResolvedValue();

    const { ctx, cookies } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "jwt@example.com",
      password: "securepass1",
    });

    expect(result.success).toBe(true);
    expect(result.user.openId).toBe("jwt-user");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
    expect(cookies[0]?.value.split(".")).toHaveLength(3);
    expect(cookies[0]?.options).toMatchObject({
      httpOnly: true,
      secure: true,
      path: "/",
    });
  });
});