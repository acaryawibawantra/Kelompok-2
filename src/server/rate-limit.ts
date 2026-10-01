import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { authRateLimit } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";

export async function enforceRateLimit(
  db: Db,
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<void> {
  const now = Date.now();
  const rows = await db
    .select()
    .from(authRateLimit)
    .where(eq(authRateLimit.key, key))
    .limit(1);
  const row = rows[0];

  if (!row || now - row.windowStart.getTime() > windowMs) {
    await db
      .insert(authRateLimit)
      .values({ key, attempts: 1, windowStart: new Date(now) })
      .onConflictDoUpdate({
        target: authRateLimit.key,
        set: { attempts: 1, windowStart: new Date(now) },
      });
    return;
  }

  if (row.attempts >= limit) {
    throw new ApiError("RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi sebentar lagi.");
  }

  await db
    .update(authRateLimit)
    .set({ attempts: row.attempts + 1 })
    .where(eq(authRateLimit.key, key));
}

export function clientKey(request: Request, scope: string): string {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  return `${scope}:${ip}`;
}
