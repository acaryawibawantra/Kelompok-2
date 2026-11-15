import type { AttendanceSummary } from "@/types";

export type AttendanceBadgeId = "perfect-week" | "streak-7" | "sessions-25" | "tanpa-alpa";

export interface AttendanceBadge {
  id: AttendanceBadgeId;
  label: string;
  description: string;
}

/**
 * Lencana dihitung dari summary yang sudah ada (tanpa perubahan skema).
 * "Perfect Week": tidak ada kelas terlewat minggu ini dan minimal 3 sesi.
 */
export function computeAttendanceBadges(summary: AttendanceSummary): AttendanceBadge[] {
  const sessions = summary.totalPresent + summary.totalLate;
  const badges: AttendanceBadge[] = [];

  if (summary.week.scheduled >= 3 && summary.week.attended >= summary.week.scheduled) {
    badges.push({
      id: "perfect-week",
      label: "Perfect Week",
      description: "Semua kelas minggu ini dihadiri.",
    });
  }
  if (summary.longestStreak >= 7) {
    badges.push({
      id: "streak-7",
      label: "Streak 7",
      description: "Tujuh hari absen beruntun.",
    });
  }
  if (sessions >= 25) {
    badges.push({
      id: "sessions-25",
      label: "25 Sesi",
      description: "Total 25 sesi tercatat hadir.",
    });
  }
  if (sessions > 0 && summary.totalAbsent === 0) {
    badges.push({
      id: "tanpa-alpa",
      label: "Tanpa Alpa",
      description: "Belum pernah alpha.",
    });
  }

  return badges;
}
