import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

function isNeon(url: string) {
  return new URL(url).hostname.endsWith(".neon.tech");
}

export function createDb(url: string): Db {
  if (isNeon(url)) return drizzleNeon({ client: neon(url), schema });
  return drizzlePg({ connection: url, schema });
}
