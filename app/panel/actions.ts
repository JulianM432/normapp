"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { lockedMessage, wrongPinMessage } from "@/lib/login-messages";
import { PIN_PATTERN, verifyPin } from "@/lib/pin";
import { IP_MAX_FAILURES, clearFailures, clientKey, lockedUntil, recordFailure } from "@/lib/rate-limit";
import { startSession } from "@/lib/session";
import type { LoginState } from "./login-state";

function locked(until: Date): LoginState {
  return { error: lockedMessage(until), lockedUntil: until.getTime() };
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "");
  if (!PIN_PATTERN.test(pin)) {
    return { error: "Escribí los 6 números de tu clave.", lockedUntil: null };
  }

  const key = await clientKey();
  const lock = await lockedUntil(key);
  if (lock) return locked(lock);

  if (await verifyPin(pin, env().ADMIN_PIN_HASH)) {
    await clearFailures(key);
    await startSession();
    redirect("/panel");
  }

  const failure = await recordFailure(key);
  if (failure.lockedUntil) return locked(failure.lockedUntil);
  return { error: wrongPinMessage(failure.failedCount, IP_MAX_FAILURES), lockedUntil: null };
}
