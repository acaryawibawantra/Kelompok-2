import type { AttendanceStatus } from "@/types";

export interface AttendanceStatusMeta {
  label: string;
  /** Kelas warna badge. */
  badge: string;
  /** Warna titik indikator. */
  dot: string;
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, AttendanceStatusMeta> = {
  present: {
    label: "Hadir",
    badge: "bg-success-soft text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-success",
  },
  late: {
    label: "Terlambat",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dot: "bg-warning",
  },
  excused: {
    label: "Izin",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  absent: {
    label: "Alpha",
    badge: "bg-danger-soft text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    dot: "bg-danger",
  },
};

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = [
  "present",
  "late",
  "excused",
  "absent",
];
