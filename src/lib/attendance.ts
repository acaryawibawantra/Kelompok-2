import { addDays, format, parseISO, startOfWeek, subDays } from "date-fns";
import { localDay } from "@/lib/streak";
import type { AttendanceStatus, AttendanceSummary } from "@/lib/schemas/attendance";

const DAY_FORMAT = "yyyy-MM-dd";
const ATTENDED: readonly AttendanceStatus[] = ["present", "late"];

export interface AttendanceRecordLike {
  date: string;
  status: AttendanceStatus;
  course: string;
}

export interface AttendanceScheduleLike {
  weekday: number;
  course: string;
}

export interface AttendanceSummaryInput {
  records: AttendanceRecordLike[];
  schedules: AttendanceScheduleLike[];
  timezone: string;
  now: Date;
}

function toCalendarDate(day: string): Date {
  return parseISO(`${day}T00:00:00Z`);
}

function toDayString(date: Date): string {
  return format(date, DAY_FORMAT);
}

function isAttended(status: AttendanceStatus): boolean {
  return ATTENDED.includes(status);
}

/**
 * Hitung ringkasan presensi dari catatan + jadwal mingguan.
 *
 * Definisi streak: jumlah hari kelas berturut-turut yang dihadiri (Hadir/Terlambat),
 * dihitung mundur dari hari ini. Hari tanpa jadwal dilewati; hari kelas yang terlewat
 * (tanpa catatan) memutus streak. Hari ini yang belum diabsen tidak memutus.
 */
export function computeAttendanceSummary({
  records,
  schedules,
  timezone,
  now,
}: AttendanceSummaryInput): AttendanceSummary {
  const today = localDay(now, timezone);
  const todayCal = toCalendarDate(today);

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const schedule of schedules) {
    if (schedule.weekday >= 0 && schedule.weekday <= 6) {
      weekdayCounts[schedule.weekday] += 1;
    }
  }
  const scheduledWeekdays = new Set(schedules.map((schedule) => schedule.weekday));
  const isScheduled = (day: string) => scheduledWeekdays.has(toCalendarDate(day).getUTCDay());

  const attendedDates = new Set<string>();
  const counts = { present: 0, late: 0, absent: 0, excused: 0 };
  let lastAttendedDate: string | null = null;
  for (const record of records) {
    counts[record.status] += 1;
    if (isAttended(record.status)) {
      attendedDates.add(record.date);
      if (!lastAttendedDate || record.date > lastAttendedDate) lastAttendedDate = record.date;
    }
  }

  // Streak berjalan: mundur dari hari ini; lewati hari tanpa kelas.
  let cursor = todayCal;
  if (isScheduled(today) && !attendedDates.has(today)) cursor = subDays(todayCal, 1);
  let currentStreak = 0;
  for (let i = 0; i < 730; i += 1) {
    const key = toDayString(cursor);
    if (attendedDates.has(key)) {
      currentStreak += 1;
    } else if (isScheduled(key)) {
      break;
    }
    cursor = subDays(cursor, 1);
  }

  // Streak terpanjang: rentetan hari kelas yang dihadiri sejak catatan pertama.
  const sortedAttended = [...attendedDates].sort();
  let longestStreak = 0;
  let run = 0;
  if (sortedAttended.length > 0) {
    let day = toCalendarDate(sortedAttended[0]);
    for (let i = 0; i < 3650 && day <= todayCal; i += 1) {
      const key = toDayString(day);
      if (isScheduled(key)) {
        if (attendedDates.has(key)) {
          run += 1;
          longestStreak = Math.max(longestStreak, run);
        } else if (key !== today) {
          run = 0;
        }
      }
      day = addDays(day, 1);
    }
  }

  const totalAttended = counts.present + counts.late;
  const rateDenominator = totalAttended + counts.absent;
  const attendanceRate =
    rateDenominator > 0 ? Math.round((totalAttended / rateDenominator) * 100) : 0;

  // Minggu ini (Senin–Minggu).
  const weekStart = startOfWeek(todayCal, { weekStartsOn: 1 });
  const weekStartKey = toDayString(weekStart);
  const weekEndKey = toDayString(addDays(weekStart, 6));
  const weekRecords = records.filter(
    (record) => record.date >= weekStartKey && record.date <= weekEndKey,
  );

  const attendedByCourse = new Map<string, number>();
  for (const record of weekRecords) {
    if (isAttended(record.status)) {
      attendedByCourse.set(record.course, (attendedByCourse.get(record.course) ?? 0) + 1);
    }
  }
  const scheduledByCourse = new Map<string, number>();
  for (const schedule of schedules) {
    scheduledByCourse.set(schedule.course, (scheduledByCourse.get(schedule.course) ?? 0) + 1);
  }
  const courseNames = new Set([...attendedByCourse.keys(), ...scheduledByCourse.keys()]);
  const courses = [...courseNames]
    .map((course) => ({
      course,
      attended: attendedByCourse.get(course) ?? 0,
      scheduled: scheduledByCourse.get(course) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.scheduled - a.scheduled || b.attended - a.attended || a.course.localeCompare(b.course),
    );

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const key = toDayString(date);
    const weekday = date.getUTCDay();
    const attended = weekRecords.filter(
      (record) => record.date === key && isAttended(record.status),
    ).length;
    return { date: key, weekday, attended, scheduled: weekdayCounts[weekday] };
  });
  const weekAttended = days.reduce((sum, day) => sum + day.attended, 0);
  const weekScheduled = days.reduce((sum, day) => sum + day.scheduled, 0);
  const weekRate = weekScheduled > 0 ? Math.round((weekAttended / weekScheduled) * 100) : 0;

  const todayAttended = records.filter(
    (record) => record.date === today && isAttended(record.status),
  ).length;

  return {
    currentStreak,
    longestStreak,
    totalPresent: counts.present,
    totalLate: counts.late,
    totalAbsent: counts.absent,
    totalExcused: counts.excused,
    attendanceRate,
    todayAttended,
    todayScheduled: weekdayCounts[todayCal.getUTCDay()],
    lastAttendedDate,
    week: {
      start: weekStartKey,
      end: weekEndKey,
      attended: weekAttended,
      scheduled: weekScheduled,
      rate: weekRate,
      courses,
      days,
    },
  };
}
