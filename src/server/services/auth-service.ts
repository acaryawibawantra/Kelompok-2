import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { colorFromId } from "@/lib/utils";
import type { LoginInput, RegisterInput, UpdateMeInput, User } from "@/types";
import { newId } from "@/server/ids";
import { toUser } from "@/server/mappers";
import { hashPassword, verifyPassword } from "@/server/password";

export async function registerUser(input: RegisterInput): Promise<User> {
  const db = getDb();
  const email = input.email.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("CONFLICT", "Email sudah terdaftar.", {
      email: "Email sudah terdaftar.",
    });
  }

  const { hash, salt } = await hashPassword(input.password);
  const now = new Date();
  const id = newId("u");

  await db.insert(users).values({
    id,
    email,
    name: input.name,
    passwordHash: hash,
    passwordSalt: salt,
    avatarColor: colorFromId(email),
    createdAt: now,
    updatedAt: now,
  });

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return toUser(rows[0]!);
}

export async function loginUser(input: LoginInput): Promise<User> {
  const db = getDb();
  const email = input.email.toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const row = rows[0];
  if (!row) {
    throw new ApiError("UNAUTHORIZED", "Email atau password salah.");
  }
  const valid = await verifyPassword(input.password, row.passwordHash, row.passwordSalt);
  if (!valid) {
    throw new ApiError("UNAUTHORIZED", "Email atau password salah.");
  }
  return toUser(row);
}

export async function updateMe(userId: string, input: UpdateMeInput): Promise<User> {
  const db = getDb();
  const update: Partial<{
    name: string;
    timezone: string;
    titleFont: string;
    theme: string;
    dailyGoal: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (input.name !== undefined) update.name = input.name;
  if (input.timezone !== undefined) update.timezone = input.timezone;
  if (input.settings?.titleFont !== undefined) update.titleFont = input.settings.titleFont;
  if (input.settings?.theme !== undefined) update.theme = input.settings.theme;
  if (input.settings?.dailyGoal !== undefined) update.dailyGoal = input.settings.dailyGoal;

  await db.update(users).set(update).where(eq(users.id, userId));
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return toUser(rows[0]!);
}
