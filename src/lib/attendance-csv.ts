import type { AttendanceRecord, AttendanceStatus } from "@/types";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  excused: "Izin",
  absent: "Alpha",
};

const HEADER = ["Tanggal", "Mata Kuliah", "Ruang", "Status", "Catatan"] as const;

/** Bungkus sel kalau mengandung pemisah/quote/baris baru. */
function cell(value: string): string {
  return /[",;\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * CSV presensi satu minggu dari record yang sudah ada di memori.
 * Status memakai label Indonesia, urut tanggal lalu mata kuliah.
 */
export function buildAttendanceCsv(
  records: AttendanceRecord[],
  week: { start: string; end: string },
): string {
  const rows = records
    .filter((record) => record.date >= week.start && record.date <= week.end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.course.localeCompare(b.course))
    .map((record) => [
      record.date,
      record.course,
      record.room ?? "",
      STATUS_LABEL[record.status],
      record.note ?? "",
    ]);

  // BOM supaya Excel membaca UTF-8 dengan benar.
  return [`\uFEFF${HEADER.join(",")}`, ...rows.map((row) => row.map(cell).join(","))].join("\r\n");
}
