import type { Request } from "express";
import cookie from "cookie";
import { COOKIE_NAME } from "@shared/const";

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;

  const parsed = cookie.parse(rawCookie);
  return parsed[COOKIE_NAME] ?? null;
}