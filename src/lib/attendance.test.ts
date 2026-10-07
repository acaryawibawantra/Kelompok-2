import { describe, expect, it } from "vitest";
import { computeAttendanceSummary } from "./attendance";
import type { AttendanceStatus } from "@/lib/schemas/attendance";

const TZ = "Asia/Jakarta";
// 2026-10-07T02:00Z = Rabu 09:00 WIB.
const NOW = new Date("2026-10-07T02:00:00.000Z");

function record(date: string, status: AttendanceStatus, course = "Algoritma") {
  return { date, status, course };
}

describe("computeAttendanceSummary", () => {
  it("menghitung streak mundur, melewati hari tanpa kelas, dan hari ini belum diabsen tidak memutus", () => {
    const result = computeAttendanceSummary({
      now: NOW,
      timezone: TZ,
      schedules: [
        { weekday: 1, course: "Algoritma" },
        { weekday: 3, course: "Basis Data" },
      ],
      records: [
        record("2026-10-05", "present", "Algoritma"),
        record("2026-09-30", "present", "Basis Data"),
        record("2026-09-28", "present", "Algoritma"),
      ],
    });

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.todayScheduled).toBe(1);
    expect(result.todayAttended).toBe(0);
    expect(result.totalPresent).toBe(3);
    expect(result.attendanceRate).toBe(100);
    expect(result.lastAttendedDate).toBe("2026-10-05");
  });

  it("meringkas minggu berjalan Senin–Minggu", () => {
    const result = computeAttendanceSummary({
      now: NOW,
      timezone: TZ,
      schedules: [
        { weekday: 1, course: "Algoritma" },
        { weekday: 3, course: "Basis Data" },
      ],
      records: [record("2026-10-05", "late", "Algoritma")],
    });

    expect(result.week.start).toBe("2026-10-05");
    expect(result.week.end).toBe("2026-10-11");
    expect(result.week.attended).toBe(1);
    expect(result.week.scheduled).toBe(2);
    expect(result.week.rate).toBe(50);
    expect(result.week.days).toHaveLength(7);
    expect(result.week.courses).toEqual([
      { course: "Algoritma", attended: 1, scheduled: 1 },
      { course: "Basis Data", attended: 0, scheduled: 1 },
    ]);
  });

  it("hari kelas yang terlewat memutus streak", () => {
    const result = computeAttendanceSummary({
      now: NOW,
      timezone: TZ,
      schedules: [{ weekday: 1, course: "Algoritma" }],
      records: [
        record("2026-09-28", "present"),
        record("2026-10-05", "absent"),
      ],
    });

    expect(result.currentStreak).toBe(0);
    expect(result.totalAbsent).toBe(1);
    expect(result.attendanceRate).toBe(50);
  });

  it("beberapa kelas di hari yang sama tetap dihitung satu hari untuk streak", () => {
    const result = computeAttendanceSummary({
      now: NOW,
      timezone: TZ,
      schedules: [
        { weekday: 1, course: "Algoritma" },
        { weekday: 1, course: "Statistika" },
      ],
      records: [record("2026-10-05", "present", "Algoritma")],
    });

    // Senin 5 Okt dihadiri (1 kelas), Selasa–Rabu tidak ada kelas -> streak 1.
    expect(result.currentStreak).toBe(1);
    expect(result.todayScheduled).toBe(0);
  });

  it("tanpa jadwal maupun catatan mengembalikan nol", () => {
    const result = computeAttendanceSummary({
      now: NOW,
      timezone: TZ,
      schedules: [],
      records: [],
    });

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.week.scheduled).toBe(0);
    expect(result.week.rate).toBe(0);
  });
});
