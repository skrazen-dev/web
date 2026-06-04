import type { Request } from "express";
import { ONE_YEAR_MS } from "@shared/const";

export function getSessionCookieOptions(req: Request) {
  const secure =
    req.protocol === "https" ||
    req.headers["x-forwarded-proto"] === "https";

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: ONE_YEAR_MS,
  };
}

