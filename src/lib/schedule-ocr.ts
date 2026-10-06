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

// Kata umum non-mata-kuliah yang sering ikut terbaca OCR.
const NOISE_WORD_RE =
  /\b(hari|ruang|r\.|kelas|mk|matkul|mata kuliah|dosen|pengampu|sks|semester|smt|ganjil|genap|wib|jam)\b/gi;

// Gelar/tanda dosen: Prof, Dr, Ir, S.Kom, M.Kom, M.T, S.T, Ph.D, dst.
const DEGREE_WORD = "(?:kom|t|si|sn|pd|kes|ak|h|sos|ag|ip|ikom|ba|mm|sc|eng)";
const LECTURER_MARKER_RE = new RegExp(
  `\\b(?:prof|dr|drs|dra|ir|dosen|pengampu|ph\\.?\\s?d|m\\.?\\s?${DEGREE_WORD}|s\\.?\\s?${DEGREE_WORD}|apt|ns)\\b`,
  "i",
);

// Buang nama & gelar dosen, sisakan hanya nama mata kuliah (dan kode kelas).
function stripLecturer(text: string): string {
  let out = text;

  // 1) Buang mulai dari gelar/tanda dosen pertama.
  const marker = out.match(LECTURER_MARKER_RE);
  if (marker && marker.index !== undefined) {
    out = out.slice(0, marker.index);
  }

  // 2) Bila ada penanda kelas "(X)", buang sisa teks setelahnya (nama dosen).
  const lastParen = out.lastIndexOf(")");
  if (lastParen >= 0 && out.slice(lastParen + 1).trim().length > 0) {
    out = out.slice(0, lastParen + 1);
  }

  // 3) Bersihkan pemisah menggantung di ujung.
  return out
    .replace(/[\s,;:/\-–—]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
      .replace(NOISE_WORD_RE, " ")
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

    // Buang nama & gelar dosen: sisakan mata kuliah saja.
    rest = stripLecturer(rest);

    if (rest === "") continue;
    // Batasi agar selalu lolos validasi API (course maks 80, room maks 40).
    const course = rest.slice(0, 80).trim();
    results.push({
      weekday: activeDay,
      start,
      end,
      course,
      room: room ? room.slice(0, 40) : null,
    });
  }

  return results;
}
