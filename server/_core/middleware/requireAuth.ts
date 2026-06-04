import type { NextFunction, Request, Response } from "express";
import type { User } from "../../../drizzle/schema";
import { resolveUserFromRequest } from "../session";

export type AuthenticatedRequest = Request & { user: User };

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await resolveUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthenticatedRequest).user = user;
  next();
}