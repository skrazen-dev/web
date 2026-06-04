import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { verifySessionToken } from "./jwt";
import { extractSessionToken } from "./token";

export async function resolveUserFromRequest(
  req: Request,
): Promise<User | null> {
  const token = extractSessionToken(req);
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await getUserByOpenId(session.openId);
  if (!user || user.id !== session.userId) return null;

  return user;
}