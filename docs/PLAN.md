# PLAN — TaskCanvas v2

> Output **Langkah 0** (lihat Bagian 15 PRD). Dokumen ini adalah rencana kerja, bukan kode.
> Sumber kebenaran tetap `docs/PRD.md`. Setiap deviasi teknis dicatat di `docs/DECISIONS.md`.
>
> Versi dokumen: 2026-10-01 · Status: **menunggu persetujuan user**

---

## 0. Ringkasan Keputusan Cepat

| Topik | Keputusan |
|---|---|
| Framework | Next.js **16.3.8** (App Router) + React **19.3.0**, TypeScript strict |
| Styling | Tailwind CSS **4.3.3** (CSS-first `@theme`), token brand `#5B5CE2` |
| Server state | TanStack Query **5.104.0** |
| UI state | Zustand **5.0.15** |
| Validasi | Zod **4.6.5** (satu sumber skema + `z.infer`) |
| Drag & drop | `@dnd-kit/core` **6.3.1** + `@dnd-kit/sortable` |
| Animasi | `motion` **13.4.6** |
| Ikon | `lucide-react` **1.49.0** |
| Tanggal | `date-fns` **4.4.0** + `date-fns-tz` |
| Auth | JWT httpOnly via `jose` **6.2.12** (Fase 2) |
| Deploy | `@opennextjs/cloudflare` **1.20.7** + Wrangler **4.145.0** |
| Database | Cloudflare D1 + Drizzle ORM **0.45.3** / drizzle-kit **0.31.11** |
| Realtime | Durable Object `ProjectRoom` di Worker terpisah (`taskcanvas-realtime`) |
| Package manager | **pnpm 10.33.0** (Node 22.20.0) |
| Bahasa UI | Bahasa Indonesia (kode/komentar teknis: Inggris) |

---

## 1. Roadmap Bertahap & Urutan Commit

Kerja dilakukan **satu fase per satu**, berhenti di tiap gerbang. Setiap butir = commit kecil
Conventional Commits.

### Gerbang A — Langkah 0 (sekarang)
- `docs: move PRD into docs/`
- `docs(plan): add PLAN.md and DECISIONS.md`
- **STOP → tunggu persetujuan user.**

### Gerbang B — Fase 1 (Frontend dengan mock)
Urutan persis Bagian 15 PRD. Rencana commit:

| # | Commit | Isi |
|---|---|---|
| 1 | `chore: scaffold next.js app router with ts strict` | `create-next-app`, TS strict, ESLint, Prettier, pnpm |
| 2 | `feat(ui): add design tokens, tailwind theme, dark mode and fonts` | Tailwind v4 `@theme`, CSS vars, `next/font`, brand scale, dot-grid |
| 3 | `feat(ui): add base ui components` | Button, Input, Modal, Drawer, Avatar, Progress, Toast, Skeleton, EmptyState |
| 4 | `feat(types): add zod schemas and inferred domain types` | `lib/schemas` untuk seluruh entitas Bagian 5 |
| 5 | `feat(streak): add pure streak engine with unit tests` | `lib/streak.ts` + seluruh test case Bagian 10 |
| 6 | `feat(api): add TaskCanvasApi interface, mock implementation and seed` | `lib/api/{types,index,mock}` + latency 150–400ms + error terkontrol |
| 7 | `feat(data): add tanstack query hooks and zustand stores` | `lib/queries/*`, `lib/stores/*` |
| 8 | `feat(layout): add app shell with sidebar and header` | `(app)/layout.tsx`, Sidebar, Header, ThemeToggle, responsif |
| 9 | `feat(auth): add login and register pages with mock auth` | route group `(auth)`, validasi inline |
| 10 | `feat(myspace): add dashboard tabs, project grid and daily summary` | All Boards/Favorites/Recent, ring target, empty state |
| 11 | `feat(board): add project board with subjects, tasks, filter and crud` | SubjectColumn, TaskItem, FilterTabs, clear-completed, progress |
| 12 | `feat(board): add drag and drop and task detail drawer` | dnd-kit, optimistic update, TaskDetailDrawer |
| 13 | `feat(project): add new project modal and archive page` | NewProjectModal + template, archive project/task |
| 14 | `feat(settings): add font styles, theme, daily goal and install app` | 3 gaya font + preview, target harian, PWA install |
| 15 | `feat(streak): add streak page with heatmap and milestones` | angka, ring, heatmap 12 minggu, milestone |
| 16 | `feat(collab): add share modal, members and invites ui` | ShareModal, MemberList, PresenceStack, invites (mock) |
| 17 | `feat(pwa): add manifest, service worker and offline shell` | `public/manifest.webmanifest`, `public/sw.js`, ikon |
| 18 | `feat(polish): add motion, skeletons, a11y and responsive refinements` | animasi, focus ring, prefers-reduced-motion |
| 19 | `chore: add migration mapper and verify phase 1` | `lib/migrate-legacy.ts` + `typecheck`/`lint`/`test`/`build` |

**Akhir Fase 1:** ringkasan + cara menjalankan + screenshot → **STOP → tunggu review user.**

### Gerbang C — Fase 2 (Backend Cloudflare)
Urutan Bagian 15 PRD, 10 butir. Setiap butir 1 commit. Detail teknis lengkap (binding, auth,
authorization terpusat, D1 atomic batch, Durable Object, http layer, test) di Bagian 5–8 dokumen
ini. **STOP → tunggu konfirmasi user.**

---

## 2. Struktur Folder Final

Mengikuti Bagian 9.1 PRD, disesuaikan dengan tooling terbaru. Root repo = `Kelompok-2/`.

```
Kelompok-2/
├─ docs/
│  ├─ PRD.md                  # sudah dipindah dari root
│  ├─ PLAN.md                 # dokumen ini
│  └─ DECISIONS.md            # log deviasi & asumsi
├─ legacy-v1/                 # app HTML/CSS/JS lama (referensi migrasi & ikon)
├─ drizzle/
│  └─ migrations/             # output drizzle-kit (Fase 2)
├─ public/
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ _headers                # cache header static assets (OpenNext)
│  └─ icons/                  # dari legacy-v1/src/icons
├─ src/
│  ├─ app/
│  │  ├─ (auth)/{login,register}/page.tsx
│  │  ├─ (app)/layout.tsx               # shell: Sidebar + Header
│  │  ├─ (app)/page.tsx                 # My Space
│  │  ├─ (app)/projects/[projectId]/page.tsx
│  │  ├─ (app)/archive/page.tsx
│  │  ├─ (app)/streak/page.tsx
│  │  ├─ (app)/invites/page.tsx
│  │  ├─ (app)/settings/page.tsx
│  │  ├─ api/                           # Route Handlers (Fase 2)
│  │  │  ├─ auth/{register,login,logout,me}/route.ts
│  │  │  ├─ me/route.ts
│  │  │  ├─ projects/route.ts
│  │  │  ├─ projects/[id]/route.ts
│  │  │  ├─ projects/[id]/{archive,unarchive,favorite,members,invites,ws}/route.ts
│  │  │  ├─ projects/[id]/subjects/route.ts
│  │  │  ├─ subjects/[id]/{route,clear-completed}/route.ts
│  │  │  ├─ subjects/[id]/tasks/route.ts
│  │  │  ├─ tasks/[id]/route.ts
│  │  │  ├─ invites/{route,[id]/route,[id]/accept,[id]/decline,join}/route.ts
│  │  │  └─ streak/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ components/{ui,layout,project,board,streak,collab}/
│  ├─ lib/
│  │  ├─ api/{index.ts,types.ts,mock/,http/}
│  │  ├─ queries/
│  │  ├─ stores/
│  │  ├─ schemas/
│  │  ├─ streak.ts
│  │  ├─ ordering.ts                    # fractional indexing
│  │  ├─ migrate-legacy.ts              # impor LocalStorage lama (P1)
│  │  └─ utils.ts
│  ├─ server/                           # (Fase 2) auth, services, authorization
│  ├─ db/{schema.ts,client.ts}          # (Fase 2)
│  ├─ types/                            # re-export dari schemas (z.infer)
│  └─ middleware.ts                     # cek sesi cookie (Fase 2)
├─ worker-realtime/                     # (Fase 2) Worker + Durable Object
│  ├─ src/index.ts                      # export class ProjectRoom
│  ├─ wrangler.jsonc
│  ├─ tsconfig.json
│  └─ package.json
├─ drizzle.config.ts
├─ open-next.config.ts                  # (Fase 2)
├─ wrangler.jsonc                       # (Fase 2)
├─ next.config.ts
├─ tsconfig.json
├─ eslint.config.mjs
├─ .prettierrc
├─ .env.example
├─ .dev.vars.example
├─ .gitignore
├─ vitest.config.ts
└─ package.json
```

Penanganan aplikasi lama: `src/` lama (HTML/CSS/JS + `sw.js` + `manifest.json` + ikon) dipindah ke
`legacy-v1/`, lalu ikon disalin ke `public/icons/`. Alasan: (a) memberi ruang `src/` untuk Next.js,
(b) menyimpan referensi untuk fitur impor LocalStorage (PRD Bagian 17), (c) mempertahankan desain
lama sebagai rujukan visual.

---

## 3. Konfigurasi OpenNext + Wrangler

### 3.1 Prasyarat (versi final, dicek 2026-10-01)
- `@opennextjs/cloudflare@1.20.7`, `wrangler@4.145.0` (>= 3.99.0 wajib).
- `compatibility_date` ≥ `2024-09-23`; dipin ke tanggal terbaru yang didukung saat setup Fase 2.
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`.

### 3.2 `open-next.config.ts` (konseptual)
```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig({});
```
Caching ISR/R2 **belum** diaktifkan di v2 (aplikasi bersifat dinamis/board). Bila nanti butuh,
tambahkan `incrementalCache: r2IncrementalCache`. Dicatat di DECISIONS.

### 3.3 `wrangler.jsonc` Worker utama (konseptual)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "taskcanvas",
  "main": ".open-next/worker.js",
  "compatibility_date": "<terbaru-yang-didukung>",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [
    { "binding": "WORKER_SELF_REFERENCE", "service": "taskcanvas" }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "taskcanvas-db",
      "database_id": "<diisi setelah `wrangler d1 create`>",
      "migrations_dir": "drizzle/migrations"
    }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "PROJECT_ROOM", "class_name": "ProjectRoom", "script_name": "taskcanvas-realtime" }
    ]
  },
  "images": { "binding": "IMAGES" },
  "vars": { "APP_URL": "http://localhost:8787" }
}
```
Catatan: binding DO lintas-script memakai `script_name` (pola yang didukung) — DO **tidak**
didefinisikan di Worker OpenNext, melainkan di Worker `taskcanvas-realtime`.

### 3.4 `worker-realtime/wrangler.jsonc` (konseptual)
```jsonc
{
  "$schema": "../node_modules/wrangler/config-schema.json",
  "name": "taskcanvas-realtime",
  "main": "src/index.ts",
  "compatibility_date": "<terbaru-yang-didukung>",
  "compatibility_flags": ["nodejs_compat"],
  "exports": {
    "ProjectRoom": { "type": "durable-object", "storage": "sqlite" }
  }
}
```
> **Deviasi PRD:** PRD (Bagian 14) memakai array `migrations` lama. Dokumentasi resmi Cloudflare
> (diperbarui 2026-09-28) kini memakai field deklaratif **`exports`**. Kita pakai `exports`
> (SQLite-backed DO, rekomendasi resmi). Dicatat di DECISIONS.

### 3.5 `package.json` scripts
```jsonc
{
  "dev": "next dev",
  "build": "next build",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
  "db:generate": "drizzle-kit generate",
  "db:migrate:local": "wrangler d1 migrations apply taskcanvas-db --local",
  "db:migrate:remote": "wrangler d1 migrations apply taskcanvas-db --remote",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "vitest run"
}
```

### 3.6 Dev lokal
- Fase 1: `next dev` (mode mock).
- Fase 2: `next dev` + `initOpenNextCloudflareForDev()` di `next.config.ts` untuk bindings lokal;
  `pnpm preview` untuk menjalankan hasil build di runtime Workers.
- Secret: `wrangler secret put JWT_SECRET`. Lokal: `.dev.vars` (di-`.gitignore`).
- `.env.example`: `NEXT_PUBLIC_API_MODE=mock`, `APP_URL=http://localhost:3000`.

### 3.7 Alur Realtime (Fase 2)
1. Klien buka `GET /api/projects/:id/ws` → route handler verifikasi cookie + keanggotaan.
2. Route handler meneruskan upgrade ke DO `ProjectRoom` (`idFromName(projectId)`), WebSocket
   Hibernation API.
3. Mutasi tetap lewat REST (D1 = sumber kebenaran). Setelah sukses, route handler memanggil
   `env.PROJECT_ROOM.get(idFromName(projectId)).fetch('/broadcast', ...)`.
4. DO menyiarkan `ServerEvent` ke semua klien; klien menerapkan ke cache TanStack Query.
5. Heartbeat 30s, reconnect exponential backoff + `invalidateQueries` penuh setelah reconnect.
6. Konflik: last-write-wins per field berdasarkan `updatedAt` server.

---

## 4. Skema Database (Drizzle + D1/SQLite)

Lokasi: `src/db/schema.ts`. Semua ID `text` (nanoid). Timestamp `integer` epoch **ms**
(`mode: "timestamp_ms"`); tanggal harian `text` `'YYYY-MM-DD'` (hasil `date-fns-tz`).

```ts
import { sqliteTable, text, integer, real, index, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),          // disimpan lowercase
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  avatarColor: text("avatar_color").notNull(),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  titleFont: text("title_font").notNull().default("handwritten"),
  theme: text("theme").notNull().default("system"),
  dailyGoal: integer("daily_goal").notNull().default(3),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  emoji: text("emoji"),
  color: text("color").notNull(),
  description: text("description"),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const projectMembers = sqliteTable("project_members", {
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "editor", "viewer"] }).notNull(),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false), // per-user
  lastOpenedAt: integer("last_opened_at", { mode: "timestamp_ms" }),                 // per-user
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.projectId, t.userId] }),
  index("idx_members_user").on(t.userId),
]);

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  position: real("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [index("idx_subjects_project_pos").on(t.projectId, t.position)]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  completedBy: text("completed_by").references(() => users.id),
  assigneeId: text("assignee_id").references(() => users.id),
  dueDate: text("due_date"), // 'YYYY-MM-DD'
  priority: text("priority", { enum: ["low", "medium", "high"] }),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  position: real("position").notNull(),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [
  index("idx_tasks_subject_pos").on(t.subjectId, t.position),
  index("idx_tasks_project").on(t.projectId),
  index("idx_tasks_assignee").on(t.assigneeId),
]);

export const projectInvites = sqliteTable("project_invites", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  invitedBy: text("invited_by").notNull().references(() => users.id),
  email: text("email"),
  role: text("role", { enum: ["editor", "viewer"] }).notNull(),
  token: text("token").notNull().unique(),
  status: text("status", { enum: ["pending", "accepted", "declined", "revoked", "expired"] })
    .notNull().default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const dailyActivity = sqliteTable("daily_activity", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // 'YYYY-MM-DD' di timezone user
  completedCount: integer("completed_count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.date] })]);
```

**Aturan data:**
- Semua query task/subject/project wajib lewat `requireMember(projectId, minRole)` di `src/server/`.
- FK diaktifkan (`PRAGMA foreign_keys = ON`) — D1 memberlakukan FK.
- `position` memakai fractional indexing (`lib/ordering.ts`) + rebalance bila selisih < 1e-4.
- Batas input: judul task ≤ 200, catatan ≤ 5000, nama project ≤ 80. Batas jumlah: 50 project/user,
  30 subject/project, 500 task/project.

---

## 5. Kontrak API + Zod

Base `/api`, JSON. Auth via cookie `tc_session`. Sukses `{ "data": ... }`; gagal
`{ "error": { "code", "message", "fields?" } }`. Semua body divalidasi Zod yang sama dengan FE.

### 5.1 Skema Zod (di `src/lib/schemas/`)
Skema jadi **sumber tunggal tipe TS** (`z.infer`), diekspor ulang di `src/types/`.

| File | Skema |
|---|---|
| `common.ts` | `idSchema` (nanoid), `isoDateSchema`, `dueDateSchema` (`YYYY-MM-DD`), `pageErrorSchema` |
| `user.ts` | `registerSchema`, `loginSchema`, `updateMeSchema`, `userSettingsSchema`, `userSchema` |
| `project.ts` | `createProjectSchema`, `updateProjectSchema`, `projectSchema`, `projectListQuerySchema` |
| `subject.ts` | `createSubjectSchema`, `updateSubjectSchema`, `subjectSchema` |
| `task.ts` | `createTaskSchema`, `updateTaskSchema`, `taskSchema`, `taskFilterSchema`, `taskWithContextSchema` |
| `member.ts` | `memberSchema`, `updateMemberRoleSchema` |
| `invite.ts` | `createInviteSchema`, `inviteSchema`, `joinInviteSchema` |
| `streak.ts` | `streakSummarySchema` |

Aturan validasi kunci: password **min 8**; email lowercase+valid; `title` 1–200; `notes` ≤ 5000;
`name` project 1–80; `dailyGoal` 1–20; `color` hex; `role` enum; `priority` enum/null.

### 5.2 Endpoint (turunan Bagian 11 PRD)

**Auth**
| Method | Path | Body/Query | Respons |
|---|---|---|---|
| POST | `/auth/register` | `{name,email,password}` | `{data:User}` + cookie |
| POST | `/auth/login` | `{email,password}` | `{data:User}` + cookie |
| POST | `/auth/logout` | — | `{data:{ok:true}}` + hapus cookie |
| GET | `/auth/me` | — | `{data:User}` (401 bila belum login) |
| PATCH | `/me` | `{name?,timezone?,settings?}` | `{data:User}` |

**Projects**
| Method | Path | Keterangan |
|---|---|---|
| GET | `/projects?scope=all\|favorites\|recent&archived=bool` | `{data:Project[]}` |
| POST | `/projects` | `{name,emoji?,color,description?}` → `{data:Project}` |
| GET | `/projects/:id` | `{data:{project,subjects,tasks,members}}` + update `lastOpenedAt` |
| PATCH | `/projects/:id` | owner/editor |
| DELETE | `/projects/:id` | owner |
| POST | `/projects/:id/archive` · `/unarchive` | owner |
| POST | `/projects/:id/favorite` | `{value:boolean}` (per-user) |

**Subjects**
| Method | Path | Keterangan |
|---|---|---|
| POST | `/projects/:id/subjects` | `{name,color?}` |
| PATCH | `/subjects/:id` | `{name?,color?,position?}` |
| DELETE | `/subjects/:id` | cascade task |
| POST | `/subjects/:id/clear-completed` | `{data:{deleted:number}}` |

**Tasks**
| Method | Path | Keterangan |
|---|---|---|
| POST | `/subjects/:id/tasks` | `{title,notes?,dueDate?,priority?,assigneeId?}` |
| PATCH | `/tasks/:id` | jika `isDone` berubah → update `daily_activity` di batch sama, respons + `streak` |
| DELETE | `/tasks/:id` | |
| GET | `/tasks?archived=true` | daftar task terarsip lintas project yang boleh diakses user → `{data:ArchivedTask[]}` |
| GET | `/tasks?due=today` | task belum selesai yang jatuh tempo hari ini (timezone user) → `{data:DueTask[]}` |

Padanan untuk `tasks.listArchived()` dan `tasks.listDueToday()` di interface `TaskCanvasApi`, sehingga
implementasi `http/` menutup **semua** method mock. Keduanya melewati `requireMember` untuk setiap
project yang tersentuh, dan mengembalikan tipe turunan:

```ts
// src/lib/schemas/task.ts
export const taskWithContextSchema = taskSchema.extend({
  projectName: z.string(),
  subjectName: z.string(),
});
export type ArchivedTask = z.infer<typeof taskWithContextSchema>;
export type DueTask = z.infer<typeof taskWithContextSchema>;
```

`GET /tasks` memakai `tasksQuerySchema`:
```ts
export const tasksQuerySchema = z.object({
  archived: z.coerce.boolean().optional(),
  due: z.enum(["today"]).optional(),
});
```
Respons dibungkus `{ data: ... }`; item divalidasi `taskWithContextSchema`. `archived=true` dan
`due=today` saling eksklusif (400 bila keduanya).

**Kolaborasi**
| Method | Path | Keterangan |
|---|---|---|
| GET | `/projects/:id/members` | `{data:Member[]}` |
| PATCH | `/projects/:id/members/:userId` | `{role}` (owner) |
| DELETE | `/projects/:id/members/:userId` | owner / keluar sendiri |
| POST | `/projects/:id/invites` | `{email?,role}` → `{data:Invite}` |
| DELETE | `/invites/:id` | cabut |
| GET | `/invites` | undangan user saat ini |
| POST | `/invites/:id/accept` · `/decline` | |
| POST | `/invites/join` | `{token}` |

**Streak & Realtime**
| Method | Path | Keterangan |
|---|---|---|
| GET | `/streak` | `{data:StreakSummary}` |
| GET | `/projects/:id/ws` | Upgrade WebSocket → DO `ProjectRoom` |

**Kode error:** 400 validasi · 401 belum login · 403 tidak berhak · 404 tidak ada · 409 konflik ·
429 rate limit. Pesan error Bahasa Indonesia.

### 5.3 `lib/api/types.ts` — interface `TaskCanvasApi`
Satu interface mencakup: `auth` (register/login/logout/me/updateMe), `projects`
(list/create/get/update/delete/archive/unarchive/favorite), `subjects` (create/update/delete/
clearCompleted), `tasks` (create/update/delete), `members` (list/updateRole/remove), `invites`
(list/create/revoke/accept/decline/join), `streak.get`. Dua implementasi: `mock/` dan `http/`.
Pemilihan via `NEXT_PUBLIC_API_MODE`. Komponen hanya lewat hooks `lib/queries/`.

### 5.4 Aturan TanStack Query
- Query key: `['projects']`, `['projects', scope]`, `['project', id]`, `['streak']`, `['invites']`.
- Optimistic update + rollback untuk toggle task & drag-drop.
- `invalidateQueries` setelah mutasi.

### 5.5 Zustand (UI state saja)
`ui-store` (sidebar, modal aktif, view board/grid), `filter-store` (filter per subject),
`settings-store` (cache tema/font/target harian sebelum backend). **Data server tidak di Zustand.**

---

## 6. Aturan Streak (`lib/streak.ts`)

Fungsi murni, dipakai mock (Fase 1) dan server (Fase 2). Signature konseptual:
`computeStreak(input: { activity: DailyActivity[]; timezone: string; dailyGoal: number; now: Date }): StreakSummary`.

Mengikuti 10 aturan Bagian 10 PRD (hari per timezone, aktif bila count ≥ 1, streak berakhir
hari ini/kemarin, longest terpisah, target harian terpisah, undo mengurangi hari `completed_at`,
anti-curang, hanya `completed_by` = user, update atomik).

**Unit test wajib (Vitest):** user baru → 0; kemarin saja → 1; hari ini + kemarin → 2; ada jeda →
reset; pergantian hari Asia/Jakarta 23:59 → 00:01; undo menurunkan hitungan; longest ≠ current.

---

## 7. Rencana Autentikasi (Fase 2)

- **JWT di cookie httpOnly** via `jose`; payload `{sub,iat,exp}`; secret `env.JWT_SECRET`.
- Password: **PBKDF2-SHA256** Web Crypto, salt 16 byte, iterasi 100.000; simpan salt+hash base64.
  (Verifikasi batas iterasi di dokumentasi Workers terbaru saat implementasi.)
- Cookie: `tc_session`; `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`.
- Proteksi CSRF: `SameSite=Lax` + cek header `Origin` pada method non-GET.
- Rate limit login/register via tabel D1 (fallback) atau binding `ratelimit` bila tersedia.
- Pesan login generik: "Email atau password salah".
- Alternatif Better Auth **tidak** dipakai (default PRD: JWT+jose). Dicatat di DECISIONS.

---

## 8. Keamanan & Non-Fungsional (rencana)

- Authorization terpusat `src/server/authz.ts` → `requireMember(projectId, minRole)`; jangan
  percaya `role`/`userId` dari klien.
- Header keamanan di route/middleware: `X-Content-Type-Options`, `Referrer-Policy`, CSP longgar-aman.
- Aksesibilitas WCAG AA: focus ring, label ARIA drag handle & dialog, keyboard-navigable,
  hormati `prefers-reduced-motion`.
- Empty/loading skeleton/error state di setiap daftar & halaman.
- Target Lighthouse lokal ≥ 90 (Accessibility & Best Practices).

---

## 9. Asumsi, Deviasi Dokumen & Pertanyaan Terbuka

### Asumsi (diterima dari PRD Bagian 19)
- A1. Satu workspace per user ("My Space"), tanpa organisasi.
- A2. Undangan email tidak mengirim email sungguhan; user harus terdaftar atau pakai link.
- A3. Zona waktu default `Asia/Jakarta`, bisa diubah.
- A4. Last-write-wins cukup untuk konflik.
- A5. Nama domain & Worker ditentukan user saat deploy.

### Asumsi tambahan (dicatat di DECISIONS.md)
- B1. **Tampilan default project = Board (kolom)**, Grid adalah toggle P1 (PRD 7.3 menandai board
  sebagai inti produk).
- B2. **Auth email+password saja** di v2; login sosial adalah non-tujuan.
- B3. Nama produk sementara "✦ TaskCanvas" (teks), tanpa aset logo baru.
- B4. `position` real + fractional indexing; rebalance saat presisi habis.
- B5. App lama dipindah ke `legacy-v1/` (bukan dihapus).
- B6. Tidak mengaktifkan ISR/R2 cache di Fase 2 (aplikasi dinamis).

### Deviasi dari PRD (lihat `docs/DECISIONS.md`)
- D1. Wrangler config memakai `.jsonc` (default OpenNext terbaru), bukan `.toml`.
- D2. DO lifecycle memakai field deklaratif **`exports`** (bukan array `migrations` lama).
- D3. Drizzle ORM dipin ke **stable 0.45.3 / Kit 0.31.11**, sementara docs get-started menampilkan
  `@rc` (v1 beta). Pilihan: stabilitas.
- D4. Tailwind v4 CSS-first (`@theme`), bukan `tailwind.config.js` klasik.
- D5. Timestamp DB = epoch ms (bukan ISO text), sesuai kebebasan PRD Bagian 6.
- D6. ID memakai `nanoid` (string) alih-alih ULID.

### Pertanyaan terbuka (non-blocking, sudah punya default)
- Q1. Default project view: **Board** (asumsi B1) — konfirmasi bila ingin Grid.
- Q2. Login Google: **tidak** di v2 (asumsi B2).
- Q3. Nama/domain final & logo: sementara "✦ TaskCanvas" (asumsi B3).

---

## 10. Kriteria Selesai Langkah 0
- [x] PRD dipindah ke `docs/PRD.md`.
- [x] `docs/PLAN.md` berisi roadmap, struktur folder, konfigurasi OpenNext+wrangler, skema Drizzle,
      kontrak API+Zod, asumsi.
- [x] `docs/DECISIONS.md` berisi log deviasi awal.
- [ ] **Persetujuan user untuk mulai Fase 1.**
