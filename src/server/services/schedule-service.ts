import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { classSchedules } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type {
  ClassSchedule,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
  User,
} from "@/types";
import { newId } from "@/server/ids";
import { toClassSchedule } from "@/server/mappers";

const MAX_SCHEDULES = 100;

// Urutkan Senin duluan (weekday 1..6 lalu 0=Minggu).
function mondayFirst(weekday: number): number {
  return (weekday + 6) % 7;
}

async function findSchedule(userId: string, id: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(classSchedules)
    .where(and(eq(classSchedules.id, id), eq(classSchedules.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new ApiError("NOT_FOUND", "Jadwal tidak ditemukan.");
  return row;
}

export async function listSchedules(user: User): Promise<ClassSchedule[]> {
  const db = getDb();
  const rows = await db.select().from(classSchedules).where(eq(classSchedules.userId, user.id));
  return rows
    .map(toClassSchedule)
    .sort(
      (a, b) => mondayFirst(a.weekday) - mondayFirst(b.weekday) || a.start.localeCompare(b.start),
    );
}

export async function createSchedule(
  user: User,
  input: CreateClassScheduleInput,
): Promise<ClassSchedule> {
  const db = getDb();
  const existing = await db
    .select({ total: count() })
    .from(classSchedules)
    .where(eq(classSchedules.userId, user.id));
  if (Number(existing[0]?.total ?? 0) >= MAX_SCHEDULES) {
    throw new ApiError("CONFLICT", "Batas maksimal 100 jadwal kuliah tercapai.");
  }

  const row: typeof classSchedules.$inferSelect = {
    id: newId("cs"),
    userId: user.id,
    weekday: input.weekday,
    start: input.start,
    end: input.end,
    course: input.course,
    room: input.room ?? null,
    createdAt: new Date(),
  };
  await db.insert(classSchedules).values(row);
  return toClassSchedule(row);
}

// Impor massal hasil OCR: validasi batas total sekali, insert satu batch.
export async function createSchedulesBulk(
  user: User,
  items: CreateClassScheduleInput[],
): Promise<ClassSchedule[]> {
  const db = getDb();
  const existing = await db
    .select({ total: count() })
    .from(classSchedules)
    .where(eq(classSchedules.userId, user.id));
  if (Number(existing[0]?.total ?? 0) + items.length > MAX_SCHEDULES) {
    throw new ApiError("CONFLICT", "Impor melebihi batas maksimal 100 jadwal kuliah.");
  }

  const now = new Date();
  const rows = items.map((item) => ({
    id: newId("cs"),
    userId: user.id,
    weekday: item.weekday,
    start: item.start,
    end: item.end,
    course: item.course,
    room: item.room ?? null,
    createdAt: now,
  }));
  await db.insert(classSchedules).values(rows);
  return rows.map(toClassSchedule);
}

export async function updateSchedule(
  user: User,
  id: string,
  input: UpdateClassScheduleInput,
): Promise<ClassSchedule> {
  const db = getDb();
  await findSchedule(user.id, id);

  const update: Partial<typeof classSchedules.$inferInsert> = {};
  if (input.weekday !== undefined) update.weekday = input.weekday;
  if (input.start !== undefined) update.start = input.start;
  if (input.end !== undefined) update.end = input.end;
  if (input.course !== undefined) update.course = input.course;
  if (input.room !== undefined) update.room = input.room;
  if (Object.keys(update).length > 0) {
    await db.update(classSchedules).set(update).where(eq(classSchedules.id, id));
  }
  return toClassSchedule(await findSchedule(user.id, id));
}

export async function deleteSchedule(user: User, id: string): Promise<void> {
  const db = getDb();
  await findSchedule(user.id, id);
  await db.delete(classSchedules).where(eq(classSchedules.id, id));
}

export async function deleteAllSchedules(user: User): Promise<void> {
  const db = getDb();
  await db.delete(classSchedules).where(eq(classSchedules.userId, user.id));
}
