import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { getEnv } from "./env";
import { readSessionToken, verifySession } from "./jwt";
import { toUser } from "./mappers";
import type { User } from "@/types";

export async function getCurrentUser(request: Request): Promise<User | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const userId = await verifySession(token, getEnv().JWT_SECRET);
  if (!userId) return null;

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const row = rows[0];
  return row ? toUser(row) : null;
}

export async function requireUser(request: Request): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Kamu belum masuk. Silakan login terlebih dahulu.");
  }
  return user;
}
