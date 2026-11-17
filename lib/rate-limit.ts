import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { after } from "next/server";
import { db, loginAttempts } from "@/lib/db";

export const IP_MAX_FAILURES = 5;
const IP_WINDOW = "15 minutes";
const GLOBAL_KEY = "global";
const GLOBAL_MAX_FAILURES = 50;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const PRUNE_PROBABILITY = 0.01;
const PRUNE_BATCH = 1000;

export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `ip:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

export async function lockedUntil(key: string): Promise<Date | null> {
  const rows = await db()
    .select()
    .from(loginAttempts)
    .where(inArray(loginAttempts.key, [key, GLOBAL_KEY]));
  const now = Date.now();
  const locks: number[] = [];
  for (const row of rows) {
    if (row.key === key && row.lockedUntil && row.lockedUntil.getTime() > now) {
      locks.push(row.lockedUntil.getTime());
    }
    if (row.key === GLOBAL_KEY && row.failedCount >= GLOBAL_MAX_FAILURES) {
      const until = row.windowStart.getTime() + GLOBAL_WINDOW_MS;
      if (until > now) locks.push(until);
    }
  }
  return locks.length > 0 ? new Date(Math.max(...locks)) : null;
}

function bump(window: string, max: number | null) {
  const expired = sql`${loginAttempts.windowStart} < now() - ${window}::interval`;
  const count = sql`case when ${expired} then 1 else ${loginAttempts.failedCount} + 1 end`;
  return {
    failedCount: count,
    windowStart: sql`case when ${expired} then now() else ${loginAttempts.windowStart} end`,
    lockedUntil:
      max === null
        ? sql`null`
        : sql`case when ${count} >= ${max} then now() + ${window}::interval else null end`,
  };
}

export async function recordFailure(key: string) {
  const [ipRows] = await Promise.all([
    db()
      .insert(loginAttempts)
      .values({ key, failedCount: 1 })
      .onConflictDoUpdate({ target: loginAttempts.key, set: bump(IP_WINDOW, IP_MAX_FAILURES) })
      .returning(),
    db()
      .insert(loginAttempts)
      .values({ key: GLOBAL_KEY, failedCount: 1 })
      .onConflictDoUpdate({ target: loginAttempts.key, set: bump("1 hour", null) }),
  ]);
  if (Math.random() < PRUNE_PROBABILITY) after(pruneStale);
  const row = ipRows[0];
  if (!row) throw new Error("No se pudo registrar el intento");
  return { failedCount: row.failedCount, lockedUntil: row.lockedUntil };
}

async function pruneStale() {
  const stale = db()
    .select({ key: loginAttempts.key })
    .from(loginAttempts)
    .where(and(ne(loginAttempts.key, GLOBAL_KEY), lt(loginAttempts.windowStart, new Date(Date.now() - STALE_MS))))
    .limit(PRUNE_BATCH);
  await db().delete(loginAttempts).where(inArray(loginAttempts.key, stale));
}

export async function clearFailures(key: string) {
  await db().delete(loginAttempts).where(eq(loginAttempts.key, key));
}
