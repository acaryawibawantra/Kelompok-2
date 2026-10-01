# DECISIONS — Log Deviasi & Asumsi

Format: tanggal · keputusan · alasan · dampak. Sumber kebenaran: `docs/PRD.md`.

---

## 2026-10-01 — Langkah 0

### D1. Wrangler memakai `wrangler.jsonc`, bukan `.toml`
- **Keputusan:** konfigurasi Worker memakai `wrangler.jsonc`.
- **Alasan:** dokumentasi resmi OpenNext Cloudflare (get-started) memakai `wrangler.jsonc` sebagai
  default; JSONC mendukung komentar + `$schema`.
- **Dampak:** PRD Bagian 14 menyebut "atau .toml sesuai default OpenNext terbaru" — ini mengikuti
  dokumentasi. Tidak ada perubahan perilaku.

### D2. DO lifecycle memakai field deklaratif `exports`
- **Keputusan:** `worker-realtime/wrangler.jsonc` mendeklarasikan `ProjectRoom` lewat
  `exports: { ProjectRoom: { type: "durable-object", storage: "sqlite" } }`.
- **Alasan:** dokumentasi Cloudflare (diperbarui 2026-09-28) menyatakan `exports` menggantikan array
  `migrations` lama dan merupakan cara deklaratif terbaru; SQLite storage direkomendasikan.
- **Sumber resmi:** https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
  (halaman "Durable Object class exports", diperbarui 2026-09-28), diakses 2026-10-01.
- **Verifikasi:** akan divalidasi dengan `wrangler dev` (Worker `taskcanvas-realtime`) di awal Fase 2
  sebelum deploy; bila `exports` ditolak oleh versi Wrangler/workerd saat itu, fallback ke array
  `migrations` dan dicatat di sini.
- **Dampak:** berbeda dari contoh `migrations` di PRD Bagian 14. `exports` dan `migrations` saling
  eksklusif; kita konsisten memakai `exports`.

### D3. Drizzle dipin ke versi stable (0.45.3 / Kit 0.31.11)
- **Keputusan:** memakai `drizzle-orm@0.45.3` dan `drizzle-kit@0.31.11` (stable), bukan `@rc`.
- **Alasan:** docs get-started D1 menampilkan `@rc` (jalur v1 beta). Untuk proyek yang mengejar
  stabilitas, jalur stable lebih aman.
- **Dampak:** API skema/migrasi mengikuti v0.45. Jika ada kebutuhan fitur v1, ditinjau ulang di
  Fase 2 dan dicatat di sini.

### D4. Tailwind CSS v4 (CSS-first `@theme`)
- **Keputusan:** memakai Tailwind **4.3.3** dengan konfigurasi `@theme` di `globals.css`.
- **Alasan:** versi terbaru; skala brand 50–900 didefinisikan sebagai CSS variables.
- **Dampak:** tidak ada `tailwind.config.js` klasik. `--font-title` dikelola via CSS variable +
  `next/font`.

### D5. Timestamp DB = epoch ms (integer), API = ISO-8601 string
- **Keputusan:** `created_at`/`updated_at`/dll. memakai `integer({ mode: "timestamp_ms" })`; lapisan
  API/kontrak (termasuk `src/lib/schemas/`) tetap memakai **ISO-8601 string**.
- **Alasan:** PRD Bagian 6 memberi kebebasan memilih salah satu asalkan konsisten; integer lebih
  ringkas dan cepat diurutkan. Tipe Zod/API harus identik antara mock dan http asli.
- **Mapper:** disediakan **satu mapper terpusat di service layer** (Fase 2, mis.
  `src/server/mappers.ts`) yang mengubah row epoch ms → ISO string saat keluar dan ISO → epoch ms
  saat masuk. Mock Fase 1 mengikuti bentuk ISO yang sama, sehingga komponen tidak berubah saat
  pindah dari mock ke API asli.
- **Dampak:** konversi tidak boleh tersebar; hanya di service/mapper layer.

### D6. ID memakai `nanoid`
- **Keputusan:** semua ID = string `nanoid` (bukan ULID/UUID).
- **Alasan:** PRD mengizinkan nanoid/ULID; nanoid ringan dan aman di Workers.
- **Dampak:** tidak ada.

### B1. Default project view = Board (kolom), Grid = toggle P1
- **Alasan:** PRD 7.3 menyebut board sebagai "inti produk"; Grid ditandai P1.
- **Dampak:** Fase 1 fokus membangun board lebih dulu.

### B2. Auth email+password saja di v2
- **Alasan:** login sosial masuk daftar non-tujuan PRD Bagian 2.
- **Dampak:** tidak ada OAuth di v2.

### B3. Nama produk sementara "✦ TaskCanvas"
- **Alasan:** Q3 PRD belum dijawab; teks sementara sudah ditetapkan.
- **Dampak:** mudah diganti saat nama final ditentukan.

### B5. App lama dipindah ke `legacy-v1/`
- **Alasan:** memberi ruang `src/` untuk Next.js sekaligus menyimpan referensi desain & fitur impor
  LocalStorage (PRD Bagian 17).
- **Dampak:** `legacy-v1/` tidak di-deploy; ikon disalin ke `public/icons/`.

### B6. ISR/R2 cache tidak diaktifkan di Fase 2
- **Alasan:** aplikasi board bersifat dinamis/per-user; caching halaman tidak banyak berguna.
- **Dampak:** `open-next.config.ts` minimal. Dapat ditinjau ulang bila perlu.

---

## 2026-10-01 — Fase 1 (implementasi)

### F1. Endpoint pendukung UI di luar daftar Bagian 11
- **Keputusan:** interface `TaskCanvasApi` menambah `tasks.listArchived()` dan `tasks.listDueToday()`.
- **Alasan:** halaman Archive dan panel "jatuh tempo hari ini" di My Space memerlukan daftar lintas
  project; tidak cukup dari endpoint yang ada.
- **Dampak:** Fase 2 perlu menambah route (mis. `GET /tasks?archived=true` dan `GET /tasks?due=today`)
  atau ekuivalen. Data tetap melewati authorization keanggotaan.

### F2. Font judul dipilih lewat `data-title-font` + CSS variable
- **Keputusan:** `--font-title` diarahkan ke salah satu dari `--font-handwritten` / `--font-modern` /
  `--font-serif` melalui atribut `data-title-font` pada `<html>`.
- **Alasan:** memungkinkan pergantian font instan tanpa re-render besar, dan mendukung bootstrap
  anti-flash dari `public/theme-init.js`.
- **Dampak:** semua judul memakai utility `font-title`.

### F3. Bootstrap tema tanpa inline script
- **Keputusan:** skrip anti-flash dimuat dari `public/theme-init.js` via `next/script`
  (`beforeInteractive`).
- **Alasan:** PRD menghindari `dangerouslySetInnerHTML`.
- **Dampak:** preferensi tema/font dibaca dari `localStorage` kunci `tc-settings` sebelum paint.

### F4. Command palette & confetti target harian diimplementasikan (P1)
- **Keputusan:** `Cmd/Ctrl+K` command palette dan confetti saat target harian tercapai disertakan.
- **Alasan:** keduanya P1 di PRD 7.10 dan meningkatkan daya tarik produk.
- **Dampak:** confetti menghormati `prefers-reduced-motion` (via `MotionConfig reducedMotion="user"`)
  dan hanya muncul sekali per hari.

---

## Pertanyaan terbuka
- Q1. Default project view — asumsi **Board**.
- Q2. Login Google — asumsi **tidak** di v2.
- Q3. Nama/domain final & logo — sementara **"✦ TaskCanvas"**.
