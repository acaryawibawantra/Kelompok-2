import { describe, expect, it } from "vitest";
import { computeAttendanceBadges } from "./attendance-badges";
import type { AttendanceSummary } from "@/types";

function summary(overrides: Partial<AttendanceSummary> = {}): AttendanceSummary {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    totalExcused: 0,
    attendanceRate: 0,
    todayAttended: 0,
    todayScheduled: 0,
    lastAttendedDate: null,
    week: {
      start: "2026-10-05",
      end: "2026-10-11",
      attended: 0,
      scheduled: 0,
      rate: 0,
      courses: [],
      days: [],
    },
    ...overrides,
  };
}

describe("computeAttendanceBadges", () => {
  it("memberi Perfect Week hanya kalau minimal 3 sesi terpenuhi semua", () => {
    const ids = (value: AttendanceSummary) => computeAttendanceBadges(value).map((b) => b.id);

    expect(ids(summary({ week: { ...summary().week, attended: 3, scheduled: 3 } }))).toContain(
      "perfect-week",
    );
    expect(ids(summary({ week: { ...summary().week, attended: 2, scheduled: 3 } }))).not.toContain(
      "perfect-week",
    );
    expect(ids(summary({ week: { ...summary().week, attended: 1, scheduled: 1 } }))).not.toContain(
      "perfect-week",
    );
  });

  it("menghitung sesi dari hadir + terlambat dan menahan Tanpa Alpa saat belum ada sesi", () => {
    expect(computeAttendanceBadges(summary()).map((b) => b.id)).toEqual([]);

    const ids = computeAttendanceBadges(
      summary({ totalPresent: 20, totalLate: 5, longestStreak: 7 }),
    ).map((b) => b.id);
    expect(ids).toContain("sessions-25");
    expect(ids).toContain("streak-7");
    expect(ids).toContain("tanpa-alpa");
  });
});
