import { describe, expect, it } from "vitest";
import { parseScheduleText } from "./schedule-ocr";

describe("parseScheduleText", () => {
  it("memparse baris satu-liner: hari, jam, matkul, ruang", () => {
    const result = parseScheduleText("Senin 07:00-09:30 Pemrograman Web A-101");
    expect(result).toEqual([
      { weekday: 1, start: "07:00", end: "09:30", course: "Pemrograman Web", room: "A-101" },
    ]);
  });

  it("memparse blok per hari: baris hari diikuti baris kelas", () => {
    const result = parseScheduleText("SELASA\n10:00 - 12:00 Basis Data GK2\n13:30-15:00 Jaringan Komputer");
    expect(result).toEqual([
      { weekday: 2, start: "10:00", end: "12:00", course: "Basis Data", room: "GK2" },
      {
        weekday: 2,
        start: "13:30",
        end: "15:00",
        course: "Jaringan Komputer",
        room: null,
      },
    ]);
  });

  it("normalisasi jam pendek 7.30 menjadi 07:30 dan mendukung pemisah titik", () => {
    const result = parseScheduleText("Rabu 7.30 – 10.00 Matematika Diskrit");
    expect(result[0]).toMatchObject({ start: "07:30", end: "10:00", course: "Matematika Diskrit" });
  });

  it("mendukung kata sambung sampai / s.d. dan variasi Jum'at", () => {
    const result = parseScheduleText("Jum'at 13:00 s.d. 15:00 Kewirausahaan");
    expect(result[0]).toMatchObject({ weekday: 5, start: "13:00", end: "15:00" });
  });

  it("mengabaikan baris tanpa rentang jam (header tabel dsb.)", () => {
    const result = parseScheduleText("KARTU RENCANA STUDI\nSemester Gasal 2026/2027\nSenin 08:00-10:00 RPL B-2");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ weekday: 1, course: "RPL" });
  });

  it("weekday null bila belum ada hari yang disebut", () => {
    const result = parseScheduleText("09:00-11:00 Statistika C-3");
    expect(result[0]).toMatchObject({ weekday: null, course: "Statistika", room: "C-3" });
  });

  it("hari terakhir tetap aktif untuk baris berikutnya (gaya tabel per hari)", () => {
    const result = parseScheduleText("Kamis\n08:00-10:00 Sistem Operasi\n10:15-12:00 Sistem Operasi (Praktikum)");
    expect(result.map((item) => item.weekday)).toEqual([4, 4]);
  });

  it("teks kosong / tanpa jadwal menghasilkan array kosong", () => {
    expect(parseScheduleText("")).toEqual([]);
    expect(parseScheduleText("tidak ada jadwal di sini")).toEqual([]);
  });
});
