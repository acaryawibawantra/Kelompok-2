import { describe, expect, it } from "vitest";
import { buildAttendanceCsv } from "./attendance-csv";
import type { AttendanceRecord } from "@/types";

function record(
  id: string,
  date: string,
  status: AttendanceRecord["status"],
  course: string,
  extra: Partial<AttendanceRecord> = {},
): AttendanceRecord {
  return {
    id,
    scheduleId: null,
    date,
    status,
    course,
    room: null,
    photo: null,
    note: null,
    checkedInAt: `${date}T01:00:00.000Z`,
    createdAt: `${date}T01:00:00.000Z`,
    ...extra,
  };
}

const WEEK = { start: "2026-10-05", end: "2026-10-11" };

describe("buildAttendanceCsv", () => {
  it("menulis header Indonesia, urut tanggal, dan hanya minggu terpilih", () => {
    const csv = buildAttendanceCsv(
      [
        record("b", "2026-10-07", "late", "Basis Data", { room: "Lab 2", note: "Macet" }),
        record("a", "2026-10-05", "present", "Algoritma"),
        record("c", "2026-10-12", "present", "Algoritma"),
      ],
      WEEK,
    );

    expect(csv.split("\r\n")).toEqual([
      "\uFEFFTanggal,Mata Kuliah,Ruang,Status,Catatan",
      "2026-10-05,Algoritma,,Hadir,",
      "2026-10-07,Basis Data,Lab 2,Terlambat,Macet",
    ]);
  });

  it("mengutip sel yang mengandung koma atau kutip", () => {
    const csv = buildAttendanceCsv(
      [record("a", "2026-10-05", "excused", "Kalkulus, Lanjut", { note: 'Surat "dokter"' })],
      WEEK,
    );

    expect(csv.split("\r\n")[1]).toBe('2026-10-05,"Kalkulus, Lanjut",,Izin,"Surat ""dokter"""');
  });

  it("hanya header kalau tidak ada record di minggu itu", () => {
    expect(buildAttendanceCsv([], WEEK)).toBe("\uFEFFTanggal,Mata Kuliah,Ruang,Status,Catatan");
  });
});
