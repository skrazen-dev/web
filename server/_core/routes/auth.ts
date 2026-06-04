import { Router } from "express";
import { COOKIE_NAME } from "@shared/const";
import {
  loginWithCredentials,
  registerWithCredentials,
  type PublicUser,
} from "../auth";
import { getSessionCookieOptions } from "../cookies";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/requireAuth";

const authRouter = Router();

function toPublicUser(user: AuthenticatedRequest["user"]): PublicUser {
  return {
    id: user.id,
    openId: user.openId,
    email: user.email,
    name: user.name,
    role: user.role,
    loginMethod: user.loginMethod,
  };
}

authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "");
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const result = await loginWithCredentials({ email, password }, req, res);
  if (!result.success) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({ user: result.user, token: result.token });
});

authRouter.post("/register", async (req, res) => {
  const email = String(req.body?.email ?? "");
  const password = String(req.body?.password ?? "");
  const name = req.body?.name ? String(req.body.name) : undefined;

  if (!email || password.length < 8) {
    res
      .status(400)
      .json({ error: "email required and password must be at least 8 characters" });
    return;
  }

  const result = await registerWithCredentials(
    { email, password, name },
    req,
    res,
  );
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json({ user: result.user, token: result.token });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  res.json({ success: true });
});

export default authRouter;