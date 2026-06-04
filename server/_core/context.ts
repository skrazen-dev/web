import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { resolveUserFromRequest } from "./session";

export type TrpcContext = {
  user: User | null;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  const { req, res } = opts;
  const user = await resolveUserFromRequest(req);
  return { user, req, res };
}