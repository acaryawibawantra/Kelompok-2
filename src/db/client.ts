import { drizzle } from "drizzle-orm/d1";
import { getEnv } from "@/server/env";
import * as schema from "./schema";

export function getDb() {
  return drizzle(getEnv().DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
