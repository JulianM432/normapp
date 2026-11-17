import "server-only";
import { env } from "@/lib/env";
import { createDb, type Db } from "./client";

let instance: Db | undefined;

export function db(): Db {
  instance ??= createDb(env().DATABASE_URL);
  return instance;
}

export * from "./schema";
