# TaskCanvas v2

TaskCanvas adalah aplikasi manajemen tugas berbasis canvas visual dengan struktur
**Project → Subject → Task**, dibangun sebagai aplikasi full-stack **Next.js + Cloudflare**.
Versi lama (HTML/CSS/JS) ada di `legacy-v1/`.

> Dokumen sumber kebenaran: [`docs/PRD.md`](docs/PRD.md). Rencana: [`docs/PLAN.md`](docs/PLAN.md).
> Deviasi & asumsi: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Status

- **Fase 1 — Frontend dengan mock: selesai** (tag `phase-1-done`).
- **Fase 2 — Backend Cloudflare: selesai.** Auth sesi JWT httpOnly, D1 + Drizzle, authorization
  terpusat, CRUD, kolaborasi (invite/role), streak server-side atomik, dan realtime Durable Object.
  Layer `lib/api/http` aktif secara default (`NEXT_PUBLIC_API_MODE=http`).

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Styling | Tailwind CSS 4 |
| Server state | TanStack Query 5 · UI state: Zustand 5 |
| Validasi | Zod 4 (FE & BE) |
| Database | Cloudflare D1 + Drizzle ORM |
| Auth | JWT httpOnly (`jose`) + PBKDF2 (Web Crypto) |
| Realtime | Cloudflare Durable Object (`ProjectRoom`, WebSocket Hibernation API) |
| Deploy | `@opennextjs/cloudflare` + Wrangler |
| Test | Vitest |

## Prasyarat

- Node.js >= 20.11 (diuji Node 22) dan pnpm 10
- Wrangler 4 (devDependency)

## Menjalankan lokal (full-stack)

```bash
pnpm install
cp .dev.vars.example .dev.vars    # berisi JWT_SECRET & NEXT_PUBLIC_API_MODE=http
pnpm db:migrate:local             # buat skema D1 lokal
pnpm worker:dev                   # terminal 1: Durable Object realtime di :8788
pnpm dev                          # terminal 2: Next.js di :3000
```

Akun: daftar lewat `/register`, atau login dengan kredensial yang kamu buat.
Ingin mode mock tanpa backend? Set `NEXT_PUBLIC_API_MODE=mock`.

Variabel: `REALTIME_WS_URL` (wrangler.jsonc) menunjuk Worker realtime; dev = `ws://localhost:8788`.

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm dev` | Next.js dev server (bindings Cloudflare aktif via OpenNext) |
| `pnpm worker:dev` | Durable Object realtime (port 8788) |
| `pnpm build` / `pnpm start` | Build & jalankan Next.js |
| `pnpm preview` | Build OpenNext + jalankan di runtime Workers lokal |
| `pnpm deploy` | Build OpenNext + deploy Worker utama |
| `pnpm db:generate` | Generate migrasi Drizzle |
| `pnpm db:migrate:local` / `db:migrate:remote` | Terapkan migrasi D1 |
| `pnpm typecheck` / `lint` / `test` | Verifikasi |
| `pnpm cf-typegen` | Generate `cloudflare-env.d.ts` |

## Arsitektur singkat

```
src/
├─ app/api/            # Route Handlers (auth, projects, subjects, tasks, members, invites, streak, ws-token)
├─ server/             # authz (requireMember), services, mappers (epoch ms ↔ ISO), jwt, password, http, realtime
├─ db/                 # schema.ts (Drizzle), client.ts
├─ lib/api/            # TaskCanvasApi: mock/ dan http/
├─ lib/queries/        # hooks TanStack Query
└─ components/         # ui, layout, project, board, streak, collab, ...
worker-realtime/       # Durable Object ProjectRoom (WebSocket + presence + broadcast)
```

**Pola realtime (terverifikasi dengan `wrangler dev`):** kelas DO dideklarasikan di Worker
terpisah `taskcanvas-realtime` lewat field deklaratif `exports`; Worker utama (OpenNext) memakai
binding lintas-script `PROJECT_ROOM` (`script_name`). Mutasi REST = sumber kebenaran (D1); setelah
sukses, route handler menyiarkan event ke DO via stub. Klien membuka WebSocket langsung ke Worker
realtime memakai token berumur pendek yang diterbitkan `/api/projects/:id/ws-token` setelah sesi dan
keanggotaan diverifikasi. Detail & alasan deviasi: `docs/DECISIONS.md` (P2-A, P2-D).

## Deploy ke Cloudflare

1. **Buat D1 & terapkan migrasi**
   ```bash
   npx wrangler d1 create taskcanvas-db      # salin database_id ke wrangler.jsonc
   pnpm db:migrate:remote
   ```
2. **Set secret** untuk kedua Worker (nilai sama):
   ```bash
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put JWT_SECRET --config worker-realtime/wrangler.jsonc
   ```
3. **Deploy Worker realtime** (Durable Object) lebih dulu:
   ```bash
   pnpm worker:deploy    # nama: taskcanvas-realtime
   ```
4. **Set `REALTIME_WS_URL`** di `wrangler.jsonc` ke URL Worker realtime (mis.
   `wss://taskcanvas-realtime.<subdomain>.workers.dev`).
5. **Deploy Worker utama:**
   ```bash
   pnpm deploy           # OpenNext build + deploy
   ```

Catatan: `database_id` di `wrangler.jsonc` awalnya placeholder untuk dev lokal — wajib diganti
sebelum migrasi/deploy remote. Aplikasi tidak memakai ISR/R2 cache (halaman dinamis).

## PWA

Manifest `public/manifest.webmanifest`, service worker `public/sw.js` (aktif pada build produksi).
