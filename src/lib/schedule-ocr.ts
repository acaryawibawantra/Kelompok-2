// Parser hasil OCR teks jadwal kuliah → draf jadwal terstruktur.
// Fungsi murni (tanpa DOM/network) supaya bisa diuji unit; dipakai oleh
// ImportScheduleModal setelah Tesseract.js selesai membaca screenshot.

export interface ParsedSchedule {
  /** 0=Minggu..6=Sabtu; null bila baris tidak menyebut hari dan belum ada hari aktif. */
  weekday: number | null;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  course: string;
  room: string | null;
}

const DAY_MATCHERS: Array<{ re: RegExp; weekday: number }> = [
  { re: /\bsenin\b/i, weekday: 1 },
  { re: /\bselasa\b/i, weekday: 2 },
  { re: /\brabu\b/i, weekday: 3 },
  { re: /\bkamis\b/i, weekday: 4 },
  { re: /\bjum'?at\b|\bjumat\b/i, weekday: 5 },
  { re: /\bsabtu\b/i, weekday: 6 },
  { re: /\bminggu\b|\bahad\b/i, weekday: 0 },
];

// Rentang jam: "07:00-09:30", "7.30 – 10.00", "10:00 s.d. 12:00", "13:00 sampai 15:00"
const TIME_RANGE_RE =
  /([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:-|–|—|s\.?\s?d\.?|sampai|ingga|hingga|until|to)\s*([01]?\d|2[0-3])[:.]([0-5]\d)/i;

// Heuristik kode ruang: token pendek bergaya "A-101", "GK2", "R.301", "2.4A"
const ROOM_RE = /^([A-Za-z]{0,3}[-. ]?\d{1,3}[A-Za-z]?)$/;

// Satu regex untuk membuang semua kata hari sekaligus.
const ANY_DAY_RE = new RegExp(DAY_MATCHERS.map((matcher) => matcher.re.source).join("|"), "gi");

function normalizeTime(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${minute}`;
}

function detectDay(line: string): number | null {
  for (const matcher of DAY_MATCHERS) {
    if (matcher.re.test(line)) return matcher.weekday;
  }
  return null;
}

/**
 * Ubah teks mentah OCR menjadi daftar draf jadwal.
 * Mendukung dua bentuk umum screenshot SIAKAD:
 * 1. Satu baris per kelas: "Senin 07:00-09:30 Pemrograman Web A-101"
 * 2. Blok per hari: baris berisi hari saja, diikuti baris kelas berikutnya.
 * Baris tanpa rentang jam (mis. header tabel) diabaikan.
 */
export function parseScheduleText(text: string): ParsedSchedule[] {
  const results: ParsedSchedule[] = [];
  let activeDay: number | null = null;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const day = detectDay(line);
    if (day !== null) activeDay = day;

    const timeMatch = line.match(TIME_RANGE_RE);
    if (!timeMatch) continue; // bukan baris jadwal (header, footer, dsb.)

    const start = normalizeTime(timeMatch[1]!, timeMatch[2]!);
    const end = normalizeTime(timeMatch[3]!, timeMatch[4]!);

    // Sisa teks: buang potongan hari & rentang jam.
    let rest = line
      .replace(TIME_RANGE_RE, " ")
      .replace(ANY_DAY_RE, " ")
      .replace(/\b(hari|ruang|r\.|kelas|mk|matkul|mata kuliah)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Token terakhir yang terlihat seperti kode ruang dipisahkan sebagai ruang.
    let room: string | null = null;
    const tokens = rest.split(" ");
    const last = tokens[tokens.length - 1];
    if (last && last.length <= 12 && ROOM_RE.test(last)) {
      room = last;
      tokens.pop();
      rest = tokens.join(" ").trim();
    }

    if (rest === "") continue;
    results.push({ weekday: activeDay, start, end, course: rest, room });
  }

  return results;
}
