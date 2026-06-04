import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  openId: string;
};

function getSecretKey() {
  return new TextEncoder().encode(ENV.jwtSecret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.openId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const openId = payload.sub;
    const userId = payload.userId;
    if (typeof openId !== "string" || typeof userId !== "number") {
      return null;
    }
    return { openId, userId };
  } catch {
    return null;
  }
}