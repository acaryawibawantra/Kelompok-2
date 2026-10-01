# TaskCanvas v2

TaskCanvas adalah aplikasi manajemen tugas berbasis canvas visual dengan struktur
**Project → Subject → Task**. Versi ini merombak aplikasi HTML/CSS/JS lama (ada di
`legacy-v1/`) menjadi aplikasi full-stack **Next.js + Cloudflare**.

> Dokumen sumber kebenaran: [`docs/PRD.md`](docs/PRD.md). Rencana kerja: [`docs/PLAN.md`](docs/PLAN.md).
> Catatan deviasi & asumsi: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Status

- **Fase 1 — Frontend dengan data mock: selesai.** Semua halaman P0 berfungsi dengan data mock
  yang persisten di `localStorage`, tampilan Bahasa Indonesia, dark mode, dan 3 gaya font judul.
- **Fase 2 — Backend Cloudflare: belum dikerjakan** (menunggu konfirmasi).

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Styling | Tailwind CSS 4 (CSS-first `@theme`) |
| Server state | TanStack Query 5 |
| UI state | Zustand 5 |
| Validasi | Zod 4 |
| Drag & drop | `@dnd-kit` |
| Ikon/animasi | `lucide-react`, `motion` |
| Tanggal | `date-fns` + `date-fns-tz` |
| Test | Vitest |

## Prasyarat

- Node.js >= 20.11 (diuji pada Node 22)
- pnpm 10 (`npm i -g pnpm` bila belum ada)

## Menjalankan

```bash
pnpm install
cp .env.example .env.local   # opsional; default sudah mock
pnpm dev
```

Buka http://localhost:3000. Login dengan akun demo:

- Email: `demo@taskcanvas.app`
- Password: bebas, minimal 8 karakter

Data mock disimpan di `localStorage` (kunci `tc-mock-db-v1`). Untuk mereset data,
hapus kunci tersebut dari DevTools, atau panggil `resetDb()` dari `src/lib/api/mock`.

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm dev` | Jalankan Next.js dev server |
| `pnpm build` | Build produksi |
| `pnpm start` | Jalankan hasil build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit test (Vitest) |
| `pnpm format` | Prettier |

## Struktur singkat

```
src/
├─ app/                 # route groups (auth) & (app), API nanti di src/app/api
├─ components/          # ui, layout, project, board, streak, collab, settings, archive, dashboard
├─ lib/
│  ├─ api/              # interface TaskCanvasApi + mock (http menyusul di Fase 2)
│  ├─ queries/          # hooks TanStack Query
│  ├─ schemas/          # Zod (sumber tipe, dipakai FE & BE)
│  ├─ stores/           # Zustand
│  ├─ streak.ts         # engine streak murni + unit test
│  └─ migrate-legacy.ts # pemetaan data LocalStorage lama (P1)
└─ types/               # re-export tipe domain
```

## Arsitektur layer API

Komponen hanya memakai hooks di `src/lib/queries/` yang memanggil `api` dari
`src/lib/api`. `NEXT_PUBLIC_API_MODE=mock` memakai implementasi mock. Di Fase 2,
implementasi `http/` akan ditambahkan tanpa mengubah komponen.

Variabel opsional: `NEXT_PUBLIC_MOCK_ERROR_RATE` (0–1) untuk menyuntikkan error acak
guna menguji state gagal.

## PWA

Manifest di `public/manifest.webmanifest`, service worker di `public/sw.js`. Service
worker hanya didaftarkan pada build produksi (`pnpm build && pnpm start`).
