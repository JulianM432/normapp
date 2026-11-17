import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

const COOKIE_NAME = "norma_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

type Payload = { exp: number };

function sign(data: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(data).digest("base64url");
}

function encode(payload: Payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(value: string): Payload | null {
  const [data, signature] = value.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    return typeof payload.exp === "number" ? payload : null;
  } catch {
    return null;
  }
}

export async function startSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  (await cookies()).set(COOKIE_NAME, encode({ exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function hasSession() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const payload = decode(value);
  return payload !== null && payload.exp * 1000 > Date.now();
}

export async function requireSession() {
  if (!(await hasSession())) redirect("/panel");
}
