# PRD — TaskCanvas v2 (Rombak Full-Stack)

> **Dokumen ini adalah sumber kebenaran (source of truth) untuk agent AI.**
> Baca seluruh dokumen sebelum menulis kode apa pun. Kerjakan sesuai urutan di Bagian 13 (Alur Kerja Agent). Jangan melompati fase.

---

## 0. Ringkasan Eksekutif

**TaskCanvas** adalah aplikasi task management berbasis *canvas* visual (terinspirasi Trello/Jira) dengan struktur **Project → Subject → Task**. Versi saat ini adalah HTML/CSS/JS biasa dengan data di LocalStorage, ter-deploy di Vercel (`https://taskcanvas-omega.vercel.app/`).

Versi 2 merombak total menjadi aplikasi **full-stack** dengan:

1. Akun & login (data terikat ke user, sinkron antar-device).
2. Kolaborasi tim pada satu project (realtime).
3. Gamifikasi: **streak** yang dihitung di server, target harian, heatmap aktivitas.
4. UI/UX yang rapi, modern, dan "layak dipamerkan" supaya orang tertarik memakai produk ini.

**Strategi pengerjaan:** Frontend dulu dengan data mock sampai tampilannya bagus (Fase 1) → baru backend di Cloudflare (Fase 2).

---

## 1. Kondisi Saat Ini (Baseline)

Hasil inspeksi aplikasi yang sudah berjalan:

| Area | Kondisi sekarang |
|---|---|
| Tech | HTML + CSS + JS vanilla, PWA-ish (meta apple-mobile-web-app, tombol "Install App") |
| Data | LocalStorage ("Saved to LocalStorage") |
| Theme color | `#5B5CE2` (indigo/violet) — **pertahankan sebagai warna brand utama** |
| Navigasi | Sidebar: My Space, Projects (+ New Project), Archive, Settings; header ada ikon streak (api) + angka, toggle dark mode (🌙), badge status simpan |
| My Space | Tab "All Boards / Favorites / Recent", panel tahun berisi "N task diselesaikan" |
| Subject | Kartu subject (contoh "Kurang Banyak"), tombol "+ New Subject" |
| Task | Filter Semua / Aktif / Selesai, "+ Add Task", "N task tersisa", "Hapus yang Selesai" |
| Archive | Daftar project/task yang diarsipkan, empty state "Belum ada yang diarsipkan." |
| Settings | Gaya Font Judul: **Handwritten (default)**, **Bersih & Modern**, **Klasik Serif**; tombol Install App |
| Streak | Angka statis di frontend (tidak benar-benar dihitung) |

**Yang harus dipertahankan:** konsep canvas visual, hierarki Project → Subject → Task, 3 gaya font judul, dark mode, Archive, filter, "Hapus yang Selesai", bahasa UI **Bahasa Indonesia**, kemampuan di-install sebagai PWA.

---

## 2. Tujuan & Non-Tujuan

### Tujuan
- G1. Pengalaman visual yang kuat: terasa seperti *canvas/board*, bukan sekadar list.
- G2. User bisa daftar/login dan datanya aman, sinkron lintas device.
- G3. User bisa mengundang teman/tim ke project dan mengedit bersama secara realtime.
- G4. Streak yang akurat (server-side) + elemen gamifikasi yang membuat user kembali tiap hari.
- G5. Arsitektur bersih: FE dapat dipindah dari mock ke API asli tanpa menulis ulang komponen.

### Non-Tujuan (v2, jangan dikerjakan kecuali diminta)
- Notifikasi email/push, integrasi kalender, aplikasi native.
- Billing/pembayaran, multi-workspace/organisasi.
- Komentar, lampiran file, time tracking.
- Login sosial (Google/GitHub) — boleh jadi peningkatan nanti.

---

## 3. Persona

| Persona | Kebutuhan | Fitur kunci |
|---|---|---|
| **Mahasiswa solo** (utama) | Kelola tugas kuliah per mata kuliah, tetap konsisten | Subject = mata kuliah, streak, target harian, tampilan menarik |
| **Tim kecil/kelompok tugas** | Bagi tugas, lihat progres bersama | Share project, assignee, realtime, role |
| **Profesional ringan/freelancer** | Rapi tanpa kerumitan Jira | Board visual, archive, filter cepat |

---

## 4. Stack Teknologi (Final)

| Layer | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS (+ CSS variables untuk theme/font) |
| UI state | Zustand |
| Server state | TanStack Query |
| API | Next.js Route Handlers (`src/app/api/...`) |
| Deploy/Backend | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Realtime | Cloudflare Durable Objects (1 DO per project, WebSocket Hibernation API) |
| Auth | JWT di cookie httpOnly (lihat 8.1) |
| Validasi | Zod (dipakai bersama di FE & BE) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Animasi | `motion` (framer-motion) secukupnya |
| Ikon | `lucide-react` |
| Tanggal | `date-fns` (+ `date-fns-tz` untuk timezone streak) |
| Package manager | `pnpm` (atau npm bila pnpm tidak tersedia) |

> **Catatan penting untuk agent:** versi OpenNext, Wrangler, dan Next.js cepat berubah. **Sebelum setup, cek dokumentasi resmi terbaru** (`opennext.js.org/cloudflare`, `developers.cloudflare.com/workers`, `orm.drizzle.team`) dan sesuaikan perintah/konfigurasi. Jika dokumentasi bertentangan dengan PRD ini soal detail teknis (nama file config, flag), ikuti dokumentasi, lalu catat deviasinya di `docs/DECISIONS.md`.

---

## 5. Model Domain & Tipe TypeScript

Satu sumber tipe di `src/types/` (atau `src/lib/schemas/` via Zod + `z.infer`). Semua ID adalah `string` (nanoid/ULID). Semua timestamp ISO-8601 string di lapisan API.

```ts
export type Role = 'owner' | 'editor' | 'viewer';
export type TitleFont = 'handwritten' | 'modern' | 'serif';
export type TaskFilter = 'all' | 'active' | 'done';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;          // warna avatar inisial
  timezone: string;             // IANA, default 'Asia/Jakarta'
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  titleFont: TitleFont;         // default 'handwritten'
  theme: ThemeMode;             // default 'system'
  dailyGoal: number;            // task/hari, default 3
}

export interface Project {
  id: string;
  name: string;
  emoji: string | null;
  color: string;                // hex, untuk aksen kartu/cover
  description: string | null;
  ownerId: string;
  isFavorite: boolean;          // per-user (lihat catatan 6.1)
  isArchived: boolean;
  lastOpenedAt: string | null;  // per-user, untuk tab "Recent"
  memberCount: number;
  taskStats: { total: number; done: number };
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  position: number;             // fractional ordering
  createdAt: string;
}

export interface Task {
  id: string;
  subjectId: string;
  projectId: string;            // denormalisasi untuk query cepat
  title: string;
  notes: string | null;
  isDone: boolean;
  completedAt: string | null;
  completedBy: string | null;   // userId
  assigneeId: string | null;
  dueDate: string | null;       // 'YYYY-MM-DD'
  priority: 'low' | 'medium' | 'high' | null;
  isArchived: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  role: Role;
  joinedAt: string;
  online?: boolean;             // dari presence realtime
}

export interface Invite {
  id: string;
  projectId: string;
  projectName: string;
  email: string | null;         // null jika invite link
  role: Exclude<Role, 'owner'>;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  expiresAt: string;
}

export interface StreakSummary {
  current: number;              // hari beruntun
  longest: number;
  todayCount: number;           // task selesai hari ini (sesuai timezone user)
  dailyGoal: number;
  goalReachedToday: boolean;
  activeToday: boolean;
  lastActiveDate: string | null;
  days: Array<{ date: string; count: number }>; // 84 hari terakhir (12 minggu) untuk heatmap
  totalCompleted: number;
}
```

### 6.1 Catatan Per-User vs Per-Project
- `isFavorite` dan `lastOpenedAt` bersifat **per-user** (disimpan di `project_members`), bukan atribut global project.
- Archive project: hanya **owner** yang bisa mengarsipkan project secara global. Task bisa diarsipkan oleh editor ke atas.

---

## 6. Skema Database (Drizzle + D1/SQLite)

Letakkan di `src/db/schema.ts`. Gunakan `text` untuk ID, `integer` untuk timestamp (epoch ms) atau `text` ISO secara konsisten (pilih satu, catat di DECISIONS.md). Aktifkan `PRAGMA foreign_keys = ON` bila tersedia di D1 (D1 memberlakukan FK).

```
users
  id PK, email UNIQUE (lowercase), name, password_hash, password_salt,
  avatar_color, timezone DEFAULT 'Asia/Jakarta',
  title_font DEFAULT 'handwritten', theme DEFAULT 'system', daily_goal DEFAULT 3,
  created_at, updated_at

projects
  id PK, owner_id FK→users, name, emoji, color, description,
  is_archived DEFAULT 0, created_at, updated_at

project_members
  project_id FK, user_id FK, role ('owner'|'editor'|'viewer'),
  is_favorite DEFAULT 0, last_opened_at, joined_at
  PK (project_id, user_id)
  INDEX (user_id)

subjects
  id PK, project_id FK (ON DELETE CASCADE), name, color, position REAL, created_at
  INDEX (project_id, position)

tasks
  id PK, project_id FK (CASCADE), subject_id FK (CASCADE),
  title, notes, is_done DEFAULT 0, completed_at, completed_by FK→users,
  assignee_id FK→users NULL, due_date TEXT NULL, priority NULL,
  is_archived DEFAULT 0, position REAL, created_by FK, created_at, updated_at
  INDEX (subject_id, position), INDEX (project_id), INDEX (assignee_id)

project_invites
  id PK, project_id FK (CASCADE), invited_by FK, email NULL, role,
  token UNIQUE, status DEFAULT 'pending', expires_at, created_at

daily_activity
  user_id FK, date TEXT ('YYYY-MM-DD' di timezone user saat event), completed_count INTEGER,
  PK (user_id, date)
```

**Prinsip data:**
- Semua query ke task/subject/project **wajib** mengecek keanggotaan user di `project_members` (authorization di lapisan service, bukan di UI).
- Migrasi dikelola `drizzle-kit` ke folder `drizzle/migrations`, dijalankan lewat `wrangler d1 migrations apply`.
- Urutan (`position`) memakai bilangan real (fractional indexing: titik tengah antara dua tetangga). Lakukan rebalance bila selisih terlalu kecil.

---

## 7. Spesifikasi Fitur & Acceptance Criteria

Prioritas: **P0** = wajib di rilis ini, **P1** = sebaiknya ada, **P2** = bonus bila waktu cukup.

### 7.1 Layout & Navigasi (P0)
- Sidebar kiri (collapsible, jadi drawer di mobile): logo "✦ TaskCanvas", **My Space**, daftar **Projects** (+ tombol New Project), **Archive**, **Streak**, **Settings**, profil user di bawah.
- Header: breadcrumb, pencarian cepat (P1, `Cmd/Ctrl+K`), indikator streak (api + angka), toggle tema, avatar user, indikator kolaborator (stack avatar).
- Responsif: desktop (≥1024), tablet, mobile (sidebar → drawer, board scroll horizontal dengan snap).
- **AC:** semua halaman dapat dicapai lewat sidebar; tidak ada layout shift saat berpindah halaman; keyboard-navigable.

### 7.2 My Space / Dashboard (P0)
- Tab: **All Boards**, **Favorites**, **Recent** (dengan jumlah).
- Grid kartu project: cover warna + emoji, nama, progres bar "X/Y task diselesaikan", stack avatar anggota, tombol favorit, menu (Edit, Arsipkan, Hapus).
- Panel ringkasan: sapaan, target harian (ring progress), streak saat ini, "Task jatuh tempo hari ini".
- Empty state ilustratif dengan CTA "Buat project pertamamu".
- **AC:** favorit/recent tersaring benar; kartu menampilkan progres akurat dari data.

### 7.3 Project Board / Canvas (P0) — *inti produk*
- Subject ditampilkan sebagai **kolom/kartu** di canvas horizontal (gaya Trello), dengan toggle tampilan **Board** ↔ **Grid** (P1).
- Per subject: judul (edit inline), jumlah task, filter **Semua / Aktif / Selesai**, daftar task, `+ Add Task` (input inline, Enter untuk simpan, Esc batal), "N task tersisa", **Hapus yang Selesai** (dengan konfirmasi).
- `+ New Subject` di ujung kanan canvas.
- **Drag & drop:** pindahkan task antar-subject dan urutkan; urutkan subject (P1). Optimistic update.
- **Task item:** checkbox (animasi centang halus), judul (klik untuk edit inline), badge due date (merah jika lewat), assignee avatar, prioritas (titik warna), menu (Edit detail, Arsipkan, Hapus).
- **Task detail** (drawer/modal): judul, catatan, due date, prioritas, assignee (hanya anggota project), tombol hapus.
- Progres project di header: "X/Y task diselesaikan" + progress bar.
- **AC:** semua operasi CRUD berjalan lewat layer `lib/api` (lihat 9); filter hanya mengubah tampilan, bukan data; menghapus yang selesai hanya berlaku pada subject yang sedang dibuka; viewer tidak melihat kontrol edit.

### 7.4 New Project (P0)
- Modal: nama (wajib), emoji picker sederhana, pilihan warna (palet 8–10), deskripsi opsional. Tombol Batal / Simpan.
- **AC:** validasi Zod di sisi klien; setelah simpan langsung membuka project baru.

### 7.5 Archive (P0)
- Dua bagian: **Project terarsip** dan **Task terarsip**. Aksi: Pulihkan, Hapus permanen (konfirmasi).
- Empty state: "Belum ada yang diarsipkan."
- **AC:** item terarsip tidak muncul di My Space/board; pulihkan mengembalikan ke posisi semula.

### 7.6 Streak (P0)
- Halaman **Streak** + indikator di header.
- Isi halaman: angka streak saat ini (besar, dengan animasi api), streak terpanjang, total task selesai, **target harian** (ring progress), **heatmap 12 minggu** gaya GitHub, strip 7 hari terakhir (✓/○), milestone badge (3, 7, 14, 30, 60, 100 hari).
- Aturan perhitungan: lihat **Bagian 10**.
- **AC (Fase 1):** tampil dari data mock yang konsisten dengan aturan Bagian 10. **AC (Fase 2):** nilai dihitung server dari `daily_activity`.

### 7.7 Settings (P0)
- **Gaya Font Judul:** Handwritten (default), Bersih & Modern, Klasik Serif — dengan preview langsung memakai teks contoh.
- Tema: Terang / Gelap / Sistem. Target harian (1–20). Zona waktu (default Asia/Jakarta).
- Akun: ubah nama, logout. Tombol **Install App** (PWA).
- **AC:** perubahan font/tema berlaku seketika di seluruh app dan tersimpan (mock: localStorage; Fase 2: server).

### 7.8 Kolaborasi — UI (P0 di Fase 1, fungsional di Fase 2)
- Tombol **Bagikan** di header project → modal: daftar anggota + role, undang via email, salin **invite link**, ubah role, hapus anggota.
- Indikator kolaborator: stack avatar anggota online, kursor/penanda "sedang mengedit" (P2).
- Halaman/panel **Undangan masuk** (terima/tolak).
- Role: **owner** (semua + hapus project + kelola anggota), **editor** (CRUD subject/task), **viewer** (hanya lihat).
- **AC:** UI menyembunyikan/menonaktifkan aksi sesuai role (kontrol sebenarnya tetap di server pada Fase 2).

### 7.9 Auth — UI (P0)
- Halaman `/login` dan `/register` (nama, email, password min. 8 karakter) dengan validasi inline, state loading, pesan error ramah (Bahasa Indonesia).
- Route group `(auth)` terpisah dari `(app)`. Redirect ke `/login` bila belum login; ke `/` bila sudah login.
- Fase 1: auth palsu (mock) dengan satu user demo; **jangan** menyimpan password nyata di mock.

### 7.10 Fitur Daya Tarik Tambahan
| Fitur | Prioritas | Catatan |
|---|---|---|
| Target harian + ring progress | P0 | Bagian dari streak |
| Confetti kecil saat target harian tercapai | P1 | Ringan, hormati `prefers-reduced-motion` |
| Command palette `Ctrl/Cmd+K` | P1 | Cari project/task, aksi cepat |
| Template project (Kuliah, Startup, Personal) | P1 | Saat New Project |
| Task jatuh tempo hari ini di dashboard | P1 | |
| Keyboard shortcuts (`N` task baru, `/` cari) | P2 | |
| Share read-only link publik | P2 | |
| Presence kursor | P2 | |

---

## 8. Desain & UX

### 8.1 Arah Visual
- **Nuansa:** hangat, bersih, "canvas" — kartu dengan sudut membulat (`rounded-2xl`), bayangan lembut, sedikit tekstur titik-titik (dot-grid) pada latar canvas.
- **Brand color:** `#5B5CE2` (primary). Buat skala 50–900 di Tailwind (`brand`). Aksen sekunder: amber/orange untuk api streak, emerald untuk selesai, rose untuk lewat jatuh tempo.
- **Dark mode:** penuh, bukan sekadar invert; kontras AA minimum.
- **Font judul** lewat CSS variable `--font-title`, di-load dengan `next/font`:
  - Handwritten → misal *Caveat* / *Patrick Hand*
  - Bersih & Modern → misal *Plus Jakarta Sans* / *Inter*
  - Klasik Serif → misal *Lora* / *Playfair Display*
- Font isi: sans modern tunggal untuk keterbacaan.
- **Motion:** transisi 150–250ms; animasi centang, drag, buka modal; wajib hormati `prefers-reduced-motion`.
- **Empty state, loading skeleton, dan error state** harus ada di setiap daftar/halaman.

### 8.2 Kualitas FE (Definition of Done Fase 1)
- Terlihat polished di 375px, 768px, 1280px.
- Lighthouse (lokal) ≥ 90 untuk Accessibility & Best Practices.
- Semua elemen interaktif punya focus ring, label aksesibel, dan bisa dipakai keyboard.
- Tidak ada `any` implisit, tidak ada error/warning ESLint/TS.

---

## 9. Arsitektur Frontend

### 9.1 Struktur Folder

```
taskcanvas/
├─ docs/
│  ├─ PRD.md                # dokumen ini
│  ├─ PLAN.md               # output Langkah 0 (roadmap + keputusan)
│  └─ DECISIONS.md          # log deviasi & asumsi
├─ drizzle/                 # migrasi (Fase 2)
├─ public/                  # icons, manifest.webmanifest, sw
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (auth)/register/page.tsx
│  │  ├─ (app)/layout.tsx           # shell: sidebar + header
│  │  ├─ (app)/page.tsx             # My Space
│  │  ├─ (app)/projects/[projectId]/page.tsx
│  │  ├─ (app)/archive/page.tsx
│  │  ├─ (app)/streak/page.tsx
│  │  ├─ (app)/invites/page.tsx
│  │  ├─ api/                       # Route Handlers (Fase 2)
│  │  │  ├─ auth/{register,login,logout,me}/route.ts
│  │  │  ├─ projects/...            # lihat Bagian 11
│  │  │  └─ streak/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                        # Button, Input, Modal, Drawer, Avatar, Progress, Toast...
│  │  ├─ layout/                    # Sidebar, Header, ThemeToggle
│  │  ├─ project/                   # ProjectCard, ProjectGrid, NewProjectModal
│  │  ├─ board/                     # Board, SubjectColumn, TaskItem, TaskDetailDrawer, FilterTabs
│  │  ├─ streak/                    # StreakBadge, Heatmap, GoalRing
│  │  └─ collab/                    # ShareModal, MemberList, PresenceStack
│  ├─ lib/
│  │  ├─ api/                       # LAYER API (mock ↔ real)
│  │  │  ├─ index.ts                # export api sesuai NEXT_PUBLIC_API_MODE
│  │  │  ├─ types.ts                # interface TaskCanvasApi
│  │  │  ├─ mock/                   # implementasi mock + seed data
│  │  │  └─ http/                   # implementasi fetch asli (Fase 2)
│  │  ├─ queries/                   # hooks TanStack Query (useProjects, useTasks, ...)
│  │  ├─ stores/                    # Zustand: ui, filter, settings
│  │  ├─ schemas/                   # Zod (dipakai FE & BE)
│  │  ├─ streak.ts                  # fungsi murni hitung streak (dites unit)
│  │  ├─ ordering.ts                # fractional position
│  │  └─ utils.ts
│  ├─ server/                       # (Fase 2) auth, services, authorization
│  ├─ db/                           # (Fase 2) schema.ts, client.ts
│  └─ types/
├─ worker-realtime/                 # (Fase 2) Worker + Durable Object terpisah
├─ open-next.config.ts              # (Fase 2)
├─ wrangler.jsonc                   # (Fase 2) — atau .toml sesuai default OpenNext terbaru
├─ drizzle.config.ts
└─ package.json
```

### 9.2 Layer API (kunci agar migrasi mulus)
Definisikan **satu interface** `TaskCanvasApi` di `lib/api/types.ts` yang mencakup seluruh operasi (auth, projects, subjects, tasks, members, invites, streak, settings). Dua implementasi:

- `mock/` — data in-memory yang di-seed, persist ke `localStorage` (agar refresh tidak hilang), dengan **latency buatan 150–400ms** dan sesekali error terkontrol (untuk menguji state loading/error).
- `http/` — `fetch` ke `/api/...` (Fase 2).

Pemilihan lewat `NEXT_PUBLIC_API_MODE=mock|http`. **Komponen tidak boleh mengimpor mock langsung**; hanya lewat hooks di `lib/queries/` yang memanggil `api`.

Aturan TanStack Query: query key terstruktur (`['projects']`, `['project', id]`, `['streak']`), **optimistic update** untuk toggle task/drag-drop dengan rollback saat gagal, `invalidateQueries` setelah mutasi.

### 9.3 Zustand (UI state saja)
Sidebar terbuka/tutup, filter task aktif per subject, modal yang terbuka, tampilan board/grid, tema & font (cache lokal). **Jangan** menyimpan data server di Zustand.

---

## 10. Aturan Streak (Server-Side)

Fungsi murni di `lib/streak.ts` (dipakai mock di Fase 1 dan server di Fase 2) + unit test.

1. **Hari** ditentukan berdasarkan **timezone user** (default `Asia/Jakarta`), bukan UTC.
2. Sebuah hari dianggap **aktif** bila `daily_activity.completed_count ≥ 1`.
3. **Streak saat ini** = jumlah hari aktif berturut-turut yang berakhir pada **hari ini**, atau pada **kemarin** bila hari ini belum ada aktivitas (streak belum putus sampai hari ini berakhir).
4. Jika kemarin dan hari ini tidak aktif → streak saat ini = 0.
5. **Streak terpanjang** = rentang hari aktif berturut-turut terpanjang sepanjang riwayat.
6. **Target harian** (`dailyGoal`) terpisah dari streak: `goalReachedToday = todayCount ≥ dailyGoal`.
7. **Menyelesaikan task:** `completed_count` hari itu +1, `tasks.completed_at/by` diisi. **Membatalkan centang:** kurangi 1 pada hari **completed_at** task tersebut (minimum 0), bukan hari ini.
8. **Anti-curang sederhana:** satu task hanya menghasilkan satu hitungan per siklus selesai; centang-batal-centang pada task yang sama di hari yang sama tidak menambah ganda (hitungan mengikuti kondisi akhir).
9. Hanya task yang **user itu sendiri** selesaikan (`completed_by`) yang dihitung untuk streak user tersebut.
10. Pembaruan `daily_activity` dilakukan **dalam transaksi/`batch` D1 yang sama** dengan update task.

**Test case wajib (unit):** streak 0 pada user baru; aktivitas kemarin saja → streak 1; hari ini + kemarin → 2; ada jeda 1 hari → reset; pergantian hari di timezone Jakarta (23:59 → 00:01); undo menurunkan hitungan; longest ≠ current.

---

## 11. Kontrak API (Fase 2)

Base: `/api`. Format JSON. Auth via cookie. Sukses: `{ "data": ... }`. Gagal: `{ "error": { "code": "STRING", "message": "Pesan ramah", "fields"?: {...} } }`. Kode HTTP standar (400 validasi, 401 belum login, 403 tidak berhak, 404, 409 konflik, 429 rate limit). Semua body divalidasi dengan Zod yang sama dengan FE.

### Auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{name,email,password}` | `{data:User}` + set cookie |
| POST | `/auth/login` | `{email,password}` | `{data:User}` + set cookie |
| POST | `/auth/logout` | — | `{data:{ok:true}}` + hapus cookie |
| GET | `/auth/me` | — | `{data:User}` (401 jika belum login) |
| PATCH | `/me` | `{name?,timezone?,settings?}` | `{data:User}` |

### Projects
| Method | Path | Keterangan |
|---|---|---|
| GET | `/projects?scope=all\|favorites\|recent&archived=bool` | `{data:Project[]}` |
| POST | `/projects` | `{name,emoji?,color,description?}` → `{data:Project}` |
| GET | `/projects/:id` | `{data:{project, subjects, tasks, members}}` (juga update `lastOpenedAt`) |
| PATCH | `/projects/:id` | edit field project (owner/editor) |
| DELETE | `/projects/:id` | owner saja |
| POST | `/projects/:id/archive` · `/unarchive` | owner |
| POST | `/projects/:id/favorite` | `{value:boolean}` (per-user) |

### Subjects
| Method | Path | Keterangan |
|---|---|---|
| POST | `/projects/:id/subjects` | `{name,color?}` |
| PATCH | `/subjects/:id` | `{name?,color?,position?}` |
| DELETE | `/subjects/:id` | cascade ke task |
| POST | `/subjects/:id/clear-completed` | hapus task selesai (non-arsip) → `{data:{deleted:number}}` |

### Tasks
| Method | Path | Keterangan |
|---|---|---|
| POST | `/subjects/:id/tasks` | `{title,notes?,dueDate?,priority?,assigneeId?}` |
| PATCH | `/tasks/:id` | `{title?,notes?,isDone?,dueDate?,priority?,assigneeId?,subjectId?,position?,isArchived?}` — jika `isDone` berubah, update `daily_activity` dalam batch yang sama, respons menyertakan `streak: StreakSummary` terbaru |
| DELETE | `/tasks/:id` | |

### Kolaborasi
| Method | Path | Keterangan |
|---|---|---|
| GET | `/projects/:id/members` | `{data:Member[]}` |
| PATCH | `/projects/:id/members/:userId` | `{role}` (owner) |
| DELETE | `/projects/:id/members/:userId` | owner, atau user keluar sendiri |
| POST | `/projects/:id/invites` | `{email?,role}` → `{data:Invite}` (+ `token`/link) |
| DELETE | `/invites/:id` | cabut undangan |
| GET | `/invites` | undangan untuk user saat ini |
| POST | `/invites/:id/accept` · `/decline` | |
| POST | `/invites/join` | `{token}` (via link) |

### Streak
| Method | Path | Response |
|---|---|---|
| GET | `/streak` | `{data:StreakSummary}` |

### Realtime
| Method | Path | Keterangan |
|---|---|---|
| GET | `/projects/:id/ws` | Upgrade WebSocket → diteruskan ke Durable Object project |

---

## 12. Autentikasi (Rekomendasi & Aturan)

### 12.1 Keputusan
Gunakan **JWT di cookie httpOnly** dengan library **`jose`** (kompatibel runtime Workers) dan hashing password **PBKDF2 via Web Crypto** (`crypto.subtle`), karena `bcrypt` native tidak cocok di Workers.

- Hash: PBKDF2-SHA256, salt acak 16 byte per user, iterasi **100.000** (batas umum Workers — verifikasi di dokumentasi terbaru), simpan `salt` + `hash` (base64).
- Cookie: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800` (7 hari). Nama: `tc_session`.
- Payload JWT: `{ sub: userId, iat, exp }`. Secret dari `env.JWT_SECRET` (Wrangler secret, **jangan** di-commit).
- Proteksi CSRF: `SameSite=Lax` + cek header `Origin` pada method non-GET.
- Rate limit sederhana untuk login/register (mis. via tabel D1 atau Durable Object/`ratelimit` binding bila tersedia).
- Pesan error login **generik** ("Email atau password salah").

### 12.2 Alternatif (boleh dipertimbangkan agent, putuskan di Langkah 0)
**Better Auth** (adapter Drizzle + D1) bila ingin fitur siap pakai (OAuth, verifikasi email). Jika dipilih, catat alasan & dampak skema di `DECISIONS.md`. **Default PRD ini tetap JWT + jose.**

---

## 13. Realtime Kolaborasi (Fase 2)

### 13.1 Arsitektur
- **Durable Object `ProjectRoom`** (satu instance per `projectId`, `idFromName(projectId)`), memakai **WebSocket Hibernation API**.
- Karena OpenNext men-deploy app Next.js sebagai satu Worker, **kelas Durable Object ditempatkan di Worker terpisah** (`worker-realtime/`) dan di-bind dari Worker utama via `durable_objects.bindings` dengan `script_name`. Verifikasi pola ini di dokumentasi terbaru dan catat di PLAN.md.
- Pola sinkronisasi: **mutasi tetap lewat REST** (sumber kebenaran = D1). Setelah mutasi sukses, route handler memberi tahu DO (`stub.fetch('/broadcast', ...)`), DO menyiarkan event ke semua klien yang terhubung. Klien menerapkan event ke cache TanStack Query (`setQueryData`/`invalidate`).
- Koneksi WS: route handler `/api/projects/:id/ws` memverifikasi cookie + keanggotaan **sebelum** meneruskan upgrade ke DO.

### 13.2 Protokol Pesan (JSON)
```ts
type ServerEvent =
  | { t: 'presence'; users: { userId: string; name: string; avatarColor: string }[] }
  | { t: 'subject.created' | 'subject.updated'; subject: Subject }
  | { t: 'subject.deleted'; subjectId: string }
  | { t: 'task.created' | 'task.updated'; task: Task }
  | { t: 'task.deleted'; taskId: string }
  | { t: 'member.changed' }
  | { t: 'pong' };

type ClientEvent = { t: 'ping' } | { t: 'focus'; taskId: string | null }; // focus: P2
```
- Heartbeat tiap 30 dtk; klien auto-reconnect dengan exponential backoff, dan melakukan `invalidate` penuh setelah reconnect.
- Konflik: **last-write-wins per field** berdasarkan `updatedAt` server; cukup untuk v2.

---

## 14. Konfigurasi Cloudflare (Panduan)

> Verifikasi nama field terbaru di dokumentasi. Contoh konseptual:

```jsonc
// wrangler.jsonc  (atau wrangler.toml — ikuti default OpenNext)
{
  "name": "taskcanvas",
  "main": ".open-next/worker.js",
  "compatibility_date": "<tanggal terbaru yang didukung>",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "d1_databases": [
    { "binding": "DB", "database_name": "taskcanvas-db", "database_id": "<diisi setelah create>", "migrations_dir": "drizzle/migrations" }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "PROJECT_ROOM", "class_name": "ProjectRoom", "script_name": "taskcanvas-realtime" }
    ]
  },
  "vars": { "APP_URL": "http://localhost:8787" }
}
```
- Akses D1 dari route handler lewat `getCloudflareContext().env.DB` (dari `@opennextjs/cloudflare`), dibungkus dalam `src/db/client.ts` → `drizzle(env.DB)`.
- Secret: `wrangler secret put JWT_SECRET`. Lokal: `.dev.vars` (masuk `.gitignore`).
- Skrip `package.json`: `dev` (Next dev), `preview` (build OpenNext + jalankan di runtime Workers lokal), `deploy`, `db:generate`, `db:migrate:local`, `db:migrate:remote`, `typecheck`, `lint`, `test`.
- Tambahkan `.env.example` dan `README.md` berisi langkah setup dari nol.

---

## 15. Alur Kerja Agent (WAJIB DIIKUTI)

Agent bekerja **bertahap dan berhenti di setiap gerbang**. Jangan melanjutkan ke tahap berikutnya tanpa persetujuan eksplisit user.

### Langkah 0 — Rencana (tanpa kode aplikasi)
Hasilkan `docs/PLAN.md` berisi:
1. Roadmap bertahap + estimasi urutan commit.
2. Struktur folder final (turunan Bagian 9.1) dan lokasi route handler.
3. Konfigurasi OpenNext + wrangler (binding D1 & DO), dengan pola DO terpisah.
4. Skema database final (turunan Bagian 6) dalam bentuk Drizzle.
5. Daftar endpoint + kontrak (turunan Bagian 11), termasuk skema Zod.
6. Daftar asumsi & pertanyaan terbuka.
Tampilkan ringkasannya ke user → **STOP, tunggu persetujuan.**

### Fase 1 — Frontend dengan Mock
Urutan kerja (commit kecil & rapi per butir, gunakan Conventional Commits):
1. Inisialisasi Next.js App Router + TS strict + Tailwind + ESLint + Prettier; design tokens (warna brand, font, radius, shadow), dark mode.
2. Komponen `ui/` dasar (Button, Input, Modal, Drawer, Avatar, Progress, Toast, Skeleton, EmptyState).
3. Tipe & skema Zod seluruh entitas (Bagian 5) + `lib/streak.ts` + unit test.
4. Layer `lib/api/` (interface + mock + seed data realistis berbahasa Indonesia) + hooks TanStack Query + store Zustand.
5. Shell layout: sidebar + header + responsif.
6. Halaman auth (login/register, mock).
7. My Space (tab, kartu project, ringkasan harian, empty state).
8. Project board: subject, task, filter, CRUD, hapus yang selesai, progres, drag & drop, task detail drawer.
9. Modal New Project, Archive, Settings (3 gaya font + tema + target harian + Install App).
10. Halaman Streak (angka, ring target, heatmap, milestone).
11. UI kolaborasi: Share modal, daftar anggota, role, undangan, stack avatar (data mock).
12. Polish: animasi, skeleton, error state, aksesibilitas, responsif, PWA manifest.
13. Verifikasi: `typecheck`, `lint`, `test`, build lolos; cek manual di 375/768/1280px.

**Di akhir Fase 1:** jalankan app, buat ringkasan (apa yang selesai, cara menjalankan, screenshot bila memungkinkan, daftar asumsi/deviasi) → **STOP, tunggu review user.**

### Fase 2 — Backend di Cloudflare
1. Pasang `@opennextjs/cloudflare`, `wrangler`, konfigurasi binding D1 + DO; buat `worker-realtime/`.
2. Drizzle: skema, migrasi, seed lokal; jalankan migrasi ke D1 lokal.
3. Auth: register/login/logout/me + middleware sesi + rate limit.
4. Layer service + **authorization terpusat** (`requireMember(projectId, minRole)`).
5. CRUD project/subject/task.
6. Kolaborasi: invite (email & link), accept/decline, role, hapus anggota.
7. Streak API (memakai `lib/streak.ts`) + pembaruan `daily_activity` atomik.
8. Durable Object realtime + integrasi broadcast + klien WS (reconnect, presence).
9. Implementasi `lib/api/http/` dan ganti `NEXT_PUBLIC_API_MODE=http`; hapus ketergantungan UI pada mock.
10. Tes (unit untuk service/streak, integrasi untuk endpoint kunci) + verifikasi `wrangler dev`/`preview` lokal, lalu panduan deploy.

**Di akhir Fase 2:** ringkasan + panduan deploy → **STOP, tunggu konfirmasi user.**

### Aturan Umum Agent
- Kerjakan **satu fase per satu**; commit kecil, pesan jelas; jelaskan singkat tiap langkah.
- TypeScript **strict**; dilarang `any` kecuali dengan komentar alasan.
- Jangan menambah fitur di luar PRD tanpa bertanya. Fitur P2 hanya bila diminta.
- Semua teks UI **Bahasa Indonesia**; kode, nama variabel, dan komentar teknis boleh Bahasa Inggris.
- Jangan pernah meng-commit secret. Sediakan `.env.example`.
- Setiap asumsi/deviasi dicatat di `docs/DECISIONS.md` (tanggal, keputusan, alasan).
- Jika menemukan konflik atau ambiguitas di PRD, **tanyakan ke user** (satu pertanyaan ringkas) alih-alih menebak untuk hal yang berdampak besar.

---

## 16. Keamanan & Non-Fungsional

- **Authorization di server** untuk setiap endpoint; jangan percaya `role`/`userId` dari klien.
- Sanitasi/escape output (React sudah meng-escape; hindari `dangerouslySetInnerHTML`).
- Batas panjang input (judul task ≤ 200, catatan ≤ 5000, nama project ≤ 80).
- Batas jumlah (mis. ≤ 50 project/user, ≤ 30 subject/project, ≤ 500 task/project) untuk menjaga performa D1.
- Header keamanan dasar (CSP longgar-aman, `X-Content-Type-Options`, `Referrer-Policy`).
- Performa: aksi UI terasa instan (optimistic), TTI baik di jaringan 4G, bundle dipantau.
- Aksesibilitas: WCAG AA, semua kontrol bisa diakses keyboard, label ARIA pada drag handle & dialog.

---

## 17. Migrasi Data dari Versi Lama (P1)

- Sediakan opsi **"Impor dari LocalStorage lama"** saat pertama kali login di v2 (bila domain sama): baca data lama, petakan ke Project → Subject → Task, kirim lewat API. Jika struktur lama tidak terbaca, tampilkan pesan ramah dan lanjutkan tanpa impor.
- Fase 1: cukup siapkan fungsi pemetaan + tes dengan contoh data; integrasi ke API di Fase 2.

---

## 18. Kriteria Sukses

| Metrik | Target |
|---|---|
| Fase 1 selesai | Semua halaman P0 berfungsi dengan mock; typecheck/lint/test/build hijau; terlihat polished di 3 ukuran layar |
| Fase 2 selesai | Register→login→buat project→undang user kedua→edit bersama terlihat realtime; streak naik/turun sesuai aturan; berjalan di `wrangler dev`/preview |
| Streak | Seluruh test case Bagian 10 lulus |
| Keamanan | Akses lintas-project oleh non-anggota selalu 403/404 |

---

## 19. Asumsi Awal & Pertanyaan Terbuka

**Asumsi (agent boleh berubah dengan mencatat di DECISIONS.md):**
- A1. Satu workspace per user ("My Space"); belum ada organisasi/tim bersama.
- A2. Undangan via email **tidak mengirim email sungguhan** di v2; user target harus sudah terdaftar, atau gunakan invite link.
- A3. Zona waktu default `Asia/Jakarta`, dapat diubah di Settings.
- A4. Last-write-wins cukup untuk konflik edit.
- A5. Nama domain produksi & nama Worker ditentukan user saat deploy.

**Pertanyaan terbuka untuk user (agent tanyakan di Langkah 0 bila perlu):**
- Q1. Apakah tampilan default project: **Board (kolom)** atau **Grid kartu** seperti versi lama?
- Q2. Apakah perlu Login Google di v2 atau cukup email+password?
- Q3. Nama final produk/domain dan logo (sementara teks "✦ TaskCanvas").