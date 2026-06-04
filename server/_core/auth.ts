import type { Response } from "express";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { createJwtUser, getUserByEmail, touchUserLastSignedIn } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { signSessionToken } from "./jwt";
import { verifyPassword } from "./password";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | { success: true; user: PublicUser; token: string }
  | { success: false; error: string };

export type PublicUser = Pick<
  User,
  "id" | "openId" | "email" | "name" | "role" | "loginMethod"
>;

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    openId: user.openId,
    email: user.email,
    name: user.name,
    role: user.role,
    loginMethod: user.loginMethod,
  };
}

export async function loginWithCredentials(
  input: LoginInput,
  req: Request,
  res: Response,
): Promise<LoginResult> {
  const user = await getUserByEmail(input.email);
  if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = await signSessionToken({
    userId: user.id,
    openId: user.openId,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, cookieOptions);

  await touchUserLastSignedIn(user.id);

  return { success: true, user: toPublicUser(user), token };
}

export type RegisterInput = LoginInput & { name?: string };

export async function registerWithCredentials(
  input: RegisterInput,
  req: Request,
  res: Response,
): Promise<LoginResult | { success: false; error: string }> {
  try {
    const user = await createJwtUser({
      email: input.email,
      password: input.password,
      name: input.name,
    });
    if (!user) {
      return { success: false, error: "Failed to create user" };
    }
    return loginWithCredentials(
      { email: input.email, password: input.password },
      req,
      res,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return { success: false, error: message };
  }
}