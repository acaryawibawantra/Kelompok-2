import { addDays, format, parseISO } from "date-fns";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { attendanceRecords, attendanceShares, classSchedules, users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { computeAttendanceSummary } from "@/lib/attendance";
import { localDay } from "@/lib/streak";
import type {
  AttendanceRecord,
  AttendanceShare,
  AttendanceSummary,
  CreateAttendanceInput,
  PublicRecap,
  UpdateAttendanceInput,
  User,
} from "@/types";
import { newId, newRecapToken } from "@/server/ids";
import { toAttendanceRecord, toUser } from "@/server/mappers";

const ATTENDED_STATUSES = ["present", "late"] as const;

function requiresProof(status: string): boolean {
  return (ATTENDED_STATUSES as readonly string[]).includes(status);
}

async function findRecord(userId: string, id: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.id, id), eq(attendanceRecords.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new ApiError("NOT_FOUND", "Catatan presensi tidak ditemukan.");
  return row;
}

function assertNotFuture(date: string, timezone: string): void {
  if (date > localDay(new Date(), timezone)) {
    throw new ApiError("VALIDATION_ERROR", "Tanggal presensi tidak boleh di masa depan.");
  }
}

export interface AttendanceRange {
  from?: string;
  to?: string;
}

export async function listAttendance(
  user: User,
  range: AttendanceRange = {},
): Promise<AttendanceRecord[]> {
  const db = getDb();
  const filters: SQL[] = [eq(attendanceRecords.userId, user.id)];
  if (range.from) filters.push(gte(attendanceRecords.date, range.from));
  if (range.to) filters.push(lte(attendanceRecords.date, range.to));
  const rows = await db
    .select()
    .from(attendanceRecords)
    .where(and(...filters))
    .orderBy(desc(attendanceRecords.date), desc(attendanceRecords.checkedInAt));
  return rows.map(toAttendanceRecord);
}

export async function checkInAttendance(
  user: User,
  input: CreateAttendanceInput,
): Promise<AttendanceRecord> {
  const db = getDb();
  assertNotFuture(input.date, user.timezone);

  let course = input.course ?? "";
  let room = input.room ?? null;

  if (input.scheduleId) {
    const rows = await db
      .select()
      .from(classSchedules)
      .where(and(eq(classSchedules.id, input.scheduleId), eq(classSchedules.userId, user.id)))
      .limit(1);
    const schedule = rows[0];
    if (!schedule) throw new ApiError("NOT_FOUND", "Jadwal tidak ditemukan.");
    // Snapshot dari jadwal agar konsisten walau jadwal diubah nanti.
    course = schedule.course;
    room = schedule.room;
  }

  if (course.trim() === "") {
    throw new ApiError("VALIDATION_ERROR", "Mata kuliah wajib diisi.");
  }

  const existing = input.scheduleId
    ? (
        await db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.userId, user.id),
              eq(attendanceRecords.scheduleId, input.scheduleId),
              eq(attendanceRecords.date, input.date),
            ),
          )
          .limit(1)
      )[0]
    : undefined;

  const now = new Date();
  if (existing) {
    await db
      .update(attendanceRecords)
      .set({
        status: input.status,
        photo: input.photo ?? null,
        note: input.note ?? null,
        course,
        room,
        checkedInAt: now,
      })
      .where(eq(attendanceRecords.id, existing.id));
    return toAttendanceRecord(await findRecord(user.id, existing.id));
  }

  const row: typeof attendanceRecords.$inferInsert = {
    id: newId("at"),
    userId: user.id,
    scheduleId: input.scheduleId ?? null,
    date: input.date,
    status: input.status,
    course,
    room,
    photo: input.photo ?? null,
    note: input.note ?? null,
    checkedInAt: now,
    createdAt: now,
  };
  await db.insert(attendanceRecords).values(row);
  return toAttendanceRecord(row as typeof attendanceRecords.$inferSelect);
}

export async function updateAttendance(
  user: User,
  id: string,
  input: UpdateAttendanceInput,
): Promise<AttendanceRecord> {
  const db = getDb();
  const record = await findRecord(user.id, id);

  const nextStatus = input.status ?? record.status;
  const nextPhoto = input.photo !== undefined ? input.photo : record.photo;
  if (requiresProof(nextStatus) && !nextPhoto) {
    throw new ApiError("VALIDATION_ERROR", "Foto bukti wajib untuk status Hadir atau Terlambat.");
  }

  const update: Partial<typeof attendanceRecords.$inferInsert> = {};
  if (input.status !== undefined) update.status = input.status;
  if (input.photo !== undefined) update.photo = input.photo;
  if (input.note !== undefined) update.note = input.note;
  if (Object.keys(update).length > 0) {
    await db.update(attendanceRecords).set(update).where(eq(attendanceRecords.id, id));
  }
  return toAttendanceRecord(await findRecord(user.id, id));
}

export async function deleteAttendance(user: User, id: string): Promise<void> {
  const db = getDb();
  await findRecord(user.id, id);
  await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
}

export async function getAttendanceSummary(user: User): Promise<AttendanceSummary> {
  const db = getDb();
  const [records, schedules] = await Promise.all([
    db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, user.id)),
    db
      .select({ weekday: classSchedules.weekday, course: classSchedules.course })
      .from(classSchedules)
      .where(eq(classSchedules.userId, user.id)),
  ]);

  return computeAttendanceSummary({
    records: records.map((row) => ({
      date: row.date,
      status: row.status,
      course: row.course,
    })),
    schedules,
    timezone: user.timezone,
    now: new Date(),
  });
}

// Buat (atau ambil ulang) token link rekap mingguan yang bisa dibagikan.
export async function createAttendanceShare(user: User, weekStart: string): Promise<AttendanceShare> {
  const db = getDb();
  const existing = await db
    .select()
    .from(attendanceShares)
    .where(and(eq(attendanceShares.userId, user.id), eq(attendanceShares.weekStart, weekStart)))
    .limit(1);

  const row = existing[0];
  if (row) return { token: row.token, path: `/r/${row.token}` };

  const token = newRecapToken();
  await db.insert(attendanceShares).values({
    id: newId("sh"),
    userId: user.id,
    weekStart,
    token,
    createdAt: new Date(),
  });
  return { token, path: `/r/${token}` };
}

// Rekap publik: tanpa autentikasi, hanya berdasarkan token. Menyertakan foto
// presensi minggu tersebut (gaya BeReal) beserta ringkasan statistik.
export async function getPublicRecap(token: string): Promise<PublicRecap> {
  const db = getDb();
  const shareRows = await db
    .select()
    .from(attendanceShares)
    .where(eq(attendanceShares.token, token))
    .limit(1);
  const share = shareRows[0];
  if (!share) throw new ApiError("NOT_FOUND", "Rekap tidak ditemukan atau tautan tidak valid.");

  const userRows = await db.select().from(users).where(eq(users.id, share.userId)).limit(1);
  const userRow = userRows[0];
  if (!userRow) throw new ApiError("NOT_FOUND", "Pengguna tidak ditemukan.");
  const user = toUser(userRow);

  const weekEnd = format(addDays(parseISO(`${share.weekStart}T00:00:00Z`), 6), "yyyy-MM-dd");

  const [recordRows, scheduleRows] = await Promise.all([
    db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, user.id),
          gte(attendanceRecords.date, share.weekStart),
          lte(attendanceRecords.date, weekEnd),
        ),
      )
      .orderBy(desc(attendanceRecords.date), desc(attendanceRecords.checkedInAt)),
    db
      .select({ weekday: classSchedules.weekday, course: classSchedules.course })
      .from(classSchedules)
      .where(eq(classSchedules.userId, user.id)),
  ]);

  const records = recordRows.map(toAttendanceRecord);
  const summary = computeAttendanceSummary({
    records: records.map((row) => ({ date: row.date, status: row.status, course: row.course })),
    schedules: scheduleRows,
    timezone: user.timezone,
    now: new Date(`${weekEnd}T12:00:00Z`),
  });

  return {
    name: user.name,
    avatarColor: user.avatarColor,
    weekStart: share.weekStart,
    summary,
    records,
  };
}
