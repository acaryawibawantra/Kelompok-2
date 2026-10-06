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

## 2026-10-01 — Fase 2 (backend Cloudflare)

### P2-A. Pola Durable Object terpisah DIVERIFIKASI dengan `wrangler dev`
- **Konfigurasi:** Worker `taskcanvas-realtime` mendeklarasikan kelas `ProjectRoom` lewat field
  deklaratif `exports` (`{ type: "durable-object", storage: "sqlite" }`), dan Worker utama
  (`taskcanvas`, OpenNext) memakai binding lintas-script
  `{ name: "PROJECT_ROOM", class_name: "ProjectRoom", script_name: "taskcanvas-realtime" }`.
- **Hasil uji lokal (2026-10-01):**
  - `wrangler dev --config worker-realtime/wrangler.jsonc` menerima field `exports` tanpa error;
    binding dilaporkan `env.PROJECT_ROOM (ProjectRoom) — Durable Object — local`.
  - `GET /health?project=p_kuliah` mengembalikan JSON dari DO dengan id berbeda per project.
  - Worker probe terpisah dengan `script_name: taskcanvas-realtime` menampilkan binding
    `local [connected]` dan berhasil memanggil DO lewat `stub.fetch(...)` (cross-worker).
- **Kesimpulan:** pola DO terpisah + `script_name` + `exports` **valid** dan dapat dikembangkan.
  Tidak perlu fallback ke `migrations` lama.

### P2-B. `database_id` placeholder untuk dev lokal
- **Keputusan:** `wrangler.jsonc` memakai `"database_id": "local-placeholder"`.
- **Alasan:** dev lokal (`--local`) tidak butuh id D1 asli; id diisi setelah `wrangler d1 create`
  saat deploy. Dicatat di panduan deploy (README/PLAN).
- **Dampak:** wajib diganti sebelum `db:migrate:remote`/`deploy`.

### P2-C. workerd/esbuild perlu `onlyBuiltDependencies`
- **Keputusan:** menambahkan `pnpm.onlyBuiltDependencies` (`workerd`, `esbuild`, `sharp`) di
  `package.json`.
- **Alasan:** pnpm 10 memblokir postinstall secara default; `wrangler dev` butuh binary workerd.
- **Dampak:** `pnpm install` menjalankan postinstall yang diperlukan.

### P2-D. Klien WebSocket terhubung langsung ke Worker realtime dengan token bertanda tangan
- **Keputusan:** route handler Next (`/api/projects/:id/ws-token`) memverifikasi sesi + keanggotaan,
  lalu menerbitkan JWT berumur pendek (klaim: `sub`, `projectId`, `name`, `avatarColor`). Klien
  membuka WebSocket **langsung** ke Worker `taskcanvas-realtime` (`REALTIME_WS_URL`) membawa token;
  DO memverifikasi tanda tangan sebelum menerima koneksi.
- **Alasan:** Route Handler Next.js tidak dapat dengan andal meneruskan upgrade `101` ke Durable
  Object. PRD 13.1 menyebut verifikasi sebelum meneruskan upgrade; verifikasi tetap dilakukan
  server-side (saat menerbitkan token) dan DO memvalidasi token, sehingga otorisasi tetap terjaga.
  PRD juga meminta memverifikasi pola di dokumentasi dan mencatat deviasi.
- **Dampak:** perlu var `REALTIME_WS_URL` (dev: `ws://localhost:8788`, prod: URL Worker realtime).
  Secret `JWT_SECRET` dibagi antara Worker utama dan Worker realtime.

### P2-E. `member.changed` juga dipakai sebagai sinyal refetch struktural
- **Keputusan:** aksi yang mengubah banyak task sekaligus (mis. `clear-completed`) menyiarkan
  `{ t: "member.changed" }` sebagai sinyal agar klien lain me-refetch project.
- **Alasan:** protokol (PRD 13.2) tidak punya event khusus untuk operasi massal.
- **Dampak:** klien memperlakukan `member.changed` sebagai invalidasi penuh project.

---

## 2026-10-06 — Fitur Jadwal Kuliah (di luar PRD, diminta user)

### S1. Jadwal kuliah mingguan per-user (Tahap A fitur presensi)
- **Keputusan:** menambah domain "Jadwal Kuliah": halaman `/jadwal` (CRUD kelas mingguan berulang —
  hari, jam mulai/selesai, mata kuliah, ruang), tabel `class_schedules`, endpoint
  `GET/POST /api/schedules` dan `PATCH/DELETE /api/schedules/:id`, skema Zod
  `lib/schemas/schedule.ts`, implementasi mock + http, hooks `lib/queries/schedules.ts`.
- **Alasan:** diminta user sebagai fondasi fitur presensi kuliah (rencana berikutnya: absen dengan
  bukti foto kamera, streak kehadiran, kartu share mingguan ala Strava). PRD v2 tidak mencakupnya.
- **Dampak:**
  - Data bersifat **per-user** (bukan per-project) sehingga tidak memakai `requireMember`; cukup
    verifikasi sesi + `where user_id` di service.
  - Tidak ada broadcast realtime (bukan resource project yang kolaboratif).
  - Sesi kuliah juga **ditampilkan di Calendar**: chip hijau emerald di grid bulanan (bersanding
    dengan task tenggat) dan bagian "Kelas" di DayAgenda.
   - Mock lama di localStorage (`tc-mock-db-v1`) di-backfill field `schedules: []` saat dibuka.

### S2. Impor jadwal dari screenshot (OCR) dengan Tesseract.js
- **Keputusan:** menambah impor massal lewat OCR: unggah screenshot jadwal → `tesseract.js`
  (`ind+eng`) membaca teks → parser murni `lib/schedule-ocr.ts` mengubahnya jadi draf
  hari/jam/matkul/ruang → user mengoreksi → disimpan lewat endpoint `POST /api/schedules/bulk`.
- **Alasan:** input manual satu per satu melelahkan; screenshot SIAKAD jadi sumber utama jadwal.
  Parser dibuat murni (tanpa DOM/network) agar bisa diuji unit (`schedule-ocr.test.ts`).
- **Dampak:** `tesseract.js` ditambahkan sebagai dependency dan di-`import()` dinamis (bundle
  utama tidak ikut berat; worker + data bahasa diambil dari CDN saat pemakaian pertama, sehingga
  butuh koneksi internet). Tombol "Impor Screenshot" ada di header halaman `/jadwal`.

### S3. Presensi kuliah: absen foto, streak kehadiran, kartu share mingguan
- **Keputusan:** menambah domain "Presensi": tabel `attendance_records`, endpoint
  `GET/POST /api/attendance`, `GET /api/attendance/summary`, `PATCH/DELETE /api/attendance/:id`,
  skema `lib/schemas/attendance.ts`, logika murni `lib/attendance.ts` (+ unit test), dan halaman
  `/presensi` (riwayat + streak + kartu share). Absen dilakukan dari panel "Kelas Hari Ini" di
  `/jadwal` lewat kamera/unggah foto.
- **Alasan:** lanjutan Tahap B yang direncanakan di S1 — bukti foto kamera, streak kehadiran, dan
  kartu share mingguan ala Strava. Belum ada di PRD v2 (fitur di luar PRD, diminta user).
- **Keputusan teknis & dampak:**
  - **Bukti foto** disimpan sebagai **data URL JPEG terkompresi di kolom `photo` (D1 text)**.
    Foto diperkecil di klien (maks 720px, kualitas 0.7) oleh `lib/attendance-media.ts`; tanpa
    R2/binding baru. Batas skema ~900 KB teks/foto. Cukup untuk demo; bila volume besar, pindah ke R2.
  - **Status:** `present | late | excused | absent`. Status Hadir/Terlambat **wajib** foto
    (divalidasi di skema + service). Izin/Alpha boleh tanpa foto.
  - **Data per-user** (bukan per-project): cukup sesi + `where user_id`, tanpa `requireMember`.
  - **Snapshot** `course`/`room` disimpan di baris presensi; `schedule_id` memakai `ON DELETE SET NULL`
    agar riwayat tetap utuh walau jadwal diubah/dihapus. Ada indeks unik
    `(user_id, schedule_id, date)` → satu sesi hanya bisa diabsen sekali per hari (check-in bersifat upsert).
  - **Streak** didefinisikan sebagai hari kelas berturut-turut yang dihadiri (Hadir/Terlambat),
    dihitung mundur dari hari ini; hari tanpa jadwal dilewati, hari kelas terlewat memutus, dan hari
    ini yang belum diabsen tidak memutus.
  - **Kartu share** menampilkan rekap minggu berjalan (Senin–Minggu) + streak, bisa dibagikan lewat
    Web Share API, disalin sebagai teks, atau diunduh sebagai PNG (render canvas di klien).
  - Mock localStorage (`tc-mock-db-v1`) di-backfill field `attendance: []`.



---

## Pertanyaan terbuka
- Q1. Default project view — asumsi **Board**.
- Q2. Login Google — asumsi **tidak** di v2.
- Q3. Nama/domain final & logo — sementara **"✦ TaskCanvas"**.
