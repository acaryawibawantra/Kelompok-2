import { formatInTimeZone } from "date-fns-tz";
import { nanoid } from "nanoid";
import type { Invite, Priority, Subject, Task, User } from "@/types";
import type { ActivityRow, MemberRow, MockDb, ProjectRow } from "./store";

const TZ = "Asia/Jakarta";
const DAY_MS = 86_400_000;

function dayOffset(now: Date, offset: number): string {
  return formatInTimeZone(new Date(now.getTime() + offset * DAY_MS), TZ, "yyyy-MM-dd");
}

function isoAgo(now: Date, daysAgo: number, hoursAgo = 0): string {
  return new Date(now.getTime() - daysAgo * DAY_MS - hoursAgo * 3_600_000).toISOString();
}

const USERS: User[] = [
  {
    id: "u_demo",
    name: "Raka Pratama",
    email: "demo@taskcanvas.app",
    avatarColor: "#5b5ce2",
    timezone: TZ,
    settings: { titleFont: "modern", theme: "system", dailyGoal: 3 },
    createdAt: "2026-01-05T02:00:00.000Z",
  },
  {
    id: "u_sinta",
    name: "Sinta Dewi",
    email: "sinta@example.com",
    avatarColor: "#10b981",
    timezone: TZ,
    settings: { titleFont: "modern", theme: "system", dailyGoal: 4 },
    createdAt: "2026-02-11T02:00:00.000Z",
  },
  {
    id: "u_bimo",
    name: "Bimo Saputra",
    email: "bimo@example.com",
    avatarColor: "#f59e0b",
    timezone: TZ,
    settings: { titleFont: "serif", theme: "dark", dailyGoal: 2 },
    createdAt: "2026-02-14T02:00:00.000Z",
  },
];

function buildProjects(now: Date): ProjectRow[] {
  return [
    {
      id: "p_kuliah",
      ownerId: "u_demo",
      name: "Kuliah Semester 5",
      emoji: "📚",
      color: "#5b5ce2",
      description: "Deadline tugas, praktikum, dan ujian semester lima.",
      isArchived: false,
      createdAt: isoAgo(now, 120),
      updatedAt: isoAgo(now, 0, 3),
    },
    {
      id: "p_lbe",
      ownerId: "u_demo",
      name: "Proyek LBE Kelompok 2",
      emoji: "🧩",
      color: "#10b981",
      description: "Tugas besar LBE RPL: aplikasi task management.",
      isArchived: false,
      createdAt: isoAgo(now, 60),
      updatedAt: isoAgo(now, 1),
    },
    {
      id: "p_personal",
      ownerId: "u_demo",
      name: "Personal & Habit",
      emoji: "🌱",
      color: "#f59e0b",
      description: "Rutinitas harian, keuangan, dan kesehatan.",
      isArchived: false,
      createdAt: isoAgo(now, 90),
      updatedAt: isoAgo(now, 2),
    },
    {
      id: "p_pkm",
      ownerId: "u_demo",
      name: "PKM Riset Dosen",
      emoji: "🔬",
      color: "#8b5cf6",
      description: "Proposal PKM yang sudah selesai dan diarsipkan.",
      isArchived: true,
      createdAt: isoAgo(now, 180),
      updatedAt: isoAgo(now, 45),
    },
    {
      id: "p_foto",
      ownerId: "u_sinta",
      name: "Klub Fotografi Kampus",
      emoji: "📷",
      color: "#ec4899",
      description: "Agenda pameran dan dokumentasi acara kampus.",
      isArchived: false,
      createdAt: isoAgo(now, 40),
      updatedAt: isoAgo(now, 3),
    },
  ];
}

const MEMBERS: MemberRow[] = [
  {
    projectId: "p_kuliah",
    userId: "u_demo",
    role: "owner",
    isFavorite: true,
    lastOpenedAt: isoAgo(new Date(), 0, 2),
    joinedAt: "2026-01-10T02:00:00.000Z",
  },
  {
    projectId: "p_kuliah",
    userId: "u_sinta",
    role: "editor",
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: "2026-01-12T02:00:00.000Z",
  },
  {
    projectId: "p_kuliah",
    userId: "u_bimo",
    role: "viewer",
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: "2026-01-12T02:00:00.000Z",
  },
  {
    projectId: "p_lbe",
    userId: "u_demo",
    role: "owner",
    isFavorite: true,
    lastOpenedAt: isoAgo(new Date(), 1),
    joinedAt: "2026-02-01T02:00:00.000Z",
  },
  {
    projectId: "p_lbe",
    userId: "u_sinta",
    role: "editor",
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: "2026-02-02T02:00:00.000Z",
  },
  {
    projectId: "p_lbe",
    userId: "u_bimo",
    role: "editor",
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: "2026-02-02T02:00:00.000Z",
  },
  {
    projectId: "p_personal",
    userId: "u_demo",
    role: "owner",
    isFavorite: false,
    lastOpenedAt: isoAgo(new Date(), 4),
    joinedAt: "2026-01-20T02:00:00.000Z",
  },
  {
    projectId: "p_pkm",
    userId: "u_demo",
    role: "owner",
    isFavorite: false,
    lastOpenedAt: isoAgo(new Date(), 40),
    joinedAt: "2025-11-02T02:00:00.000Z",
  },
  {
    projectId: "p_foto",
    userId: "u_sinta",
    role: "owner",
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: "2026-02-20T02:00:00.000Z",
  },
];

interface SubjectSeed {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
}

const SUBJECTS: SubjectSeed[] = [
  { id: "s_sd", projectId: "p_kuliah", name: "Struktur Data", color: "#5b5ce2" },
  { id: "s_bd", projectId: "p_kuliah", name: "Basis Data", color: "#0ea5e9" },
  { id: "s_pw", projectId: "p_kuliah", name: "Pemrograman Web", color: "#10b981" },
  { id: "s_riset", projectId: "p_lbe", name: "Riset", color: "#8b5cf6" },
  { id: "s_desain", projectId: "p_lbe", name: "Desain UI", color: "#ec4899" },
  { id: "s_impl", projectId: "p_lbe", name: "Implementasi", color: "#5b5ce2" },
  { id: "s_laporan", projectId: "p_lbe", name: "Laporan", color: "#f59e0b" },
  { id: "s_rutin", projectId: "p_personal", name: "Rutinitas", color: "#10b981" },
  { id: "s_keuangan", projectId: "p_personal", name: "Keuangan", color: "#f59e0b" },
  { id: "s_sehat", projectId: "p_personal", name: "Kesehatan", color: "#f43f5e" },
  { id: "s_prop", projectId: "p_pkm", name: "Proposal", color: "#8b5cf6" },
  { id: "s_foto", projectId: "p_foto", name: "Agenda", color: "#ec4899" },
];

interface TaskSeed {
  subjectId: string;
  title: string;
  notes?: string;
  done?: boolean;
  doneDaysAgo?: number;
  dueIn?: number;
  priority?: Priority;
  assigneeId?: string;
  archived?: boolean;
}

const TASK_SEEDS: TaskSeed[] = [
  {
    subjectId: "s_sd",
    title: "Implementasi linked list",
    done: true,
    doneDaysAgo: 3,
    priority: "high",
    assigneeId: "u_demo",
    notes: "Sudah lulus semua test case.",
  },
  {
    subjectId: "s_sd",
    title: "Latihan soal graph traversal",
    dueIn: 1,
    priority: "medium",
    assigneeId: "u_sinta",
  },
  { subjectId: "s_sd", title: "Review kompleksitas Big-O", dueIn: 4, priority: "low" },
  {
    subjectId: "s_sd",
    title: "Kumpulkan tugas sorting",
    done: true,
    doneDaysAgo: 0,
    priority: "high",
    assigneeId: "u_demo",
  },
  {
    subjectId: "s_sd",
    title: "Tugas lama yang diarsipkan",
    archived: true,
    done: true,
    doneDaysAgo: 15,
  },

  {
    subjectId: "s_bd",
    title: "Normalisasi ERD perpustakaan",
    dueIn: 2,
    priority: "high",
    assigneeId: "u_bimo",
  },
  { subjectId: "s_bd", title: "Query join lanjutan", dueIn: 6, priority: "medium" },
  { subjectId: "s_bd", title: "Baca bab indexing", done: true, doneDaysAgo: 2, priority: "low" },

  {
    subjectId: "s_pw",
    title: "Buat komponen navbar",
    dueIn: 0,
    priority: "medium",
    assigneeId: "u_demo",
  },
  { subjectId: "s_pw", title: "Integrasi API jadwal kuliah", dueIn: -2, priority: "high" },
  { subjectId: "s_pw", title: "Deploy proyek ke Vercel", done: true, doneDaysAgo: 5 },

  {
    subjectId: "s_riset",
    title: "Kumpulkan referensi jurnal",
    done: true,
    doneDaysAgo: 4,
    assigneeId: "u_demo",
  },
  {
    subjectId: "s_riset",
    title: "Ringkas studi terkait",
    dueIn: 3,
    priority: "medium",
    assigneeId: "u_sinta",
  },

  {
    subjectId: "s_desain",
    title: "Wireframe halaman utama",
    done: true,
    doneDaysAgo: 6,
    assigneeId: "u_demo",
  },
  {
    subjectId: "s_desain",
    title: "Design system warna & tipografi",
    dueIn: 2,
    priority: "high",
    assigneeId: "u_sinta",
  },
  { subjectId: "s_desain", title: "Prototipe klik di Figma", dueIn: 7, priority: "medium" },

  {
    subjectId: "s_impl",
    title: "Setup repo & CI",
    done: true,
    doneDaysAgo: 1,
    assigneeId: "u_demo",
  },
  {
    subjectId: "s_impl",
    title: "Implementasi board drag and drop",
    dueIn: 5,
    priority: "high",
    assigneeId: "u_demo",
    notes: "Pakai @dnd-kit, optimistic update.",
  },
  {
    subjectId: "s_impl",
    title: "Integrasi autentikasi",
    dueIn: 9,
    priority: "high",
    assigneeId: "u_bimo",
  },
  {
    subjectId: "s_impl",
    title: "Tulis unit test streak",
    dueIn: 3,
    priority: "medium",
    assigneeId: "u_demo",
  },
  { subjectId: "s_impl", title: "Ide fitur yang ditunda", archived: true },

  { subjectId: "s_laporan", title: "Susun struktur laporan", dueIn: 8, priority: "medium" },
  { subjectId: "s_laporan", title: "Draft bab metodologi", dueIn: 12, priority: "low" },

  {
    subjectId: "s_rutin",
    title: "Olahraga pagi 30 menit",
    done: true,
    doneDaysAgo: 0,
    assigneeId: "u_demo",
  },
  { subjectId: "s_rutin", title: "Baca buku 20 halaman", dueIn: 0, priority: "low" },
  { subjectId: "s_rutin", title: "Review mingguan target", dueIn: 1, priority: "medium" },

  { subjectId: "s_keuangan", title: "Catat pengeluaran minggu ini", dueIn: 1 },
  { subjectId: "s_keuangan", title: "Bayar tagihan internet", done: true, doneDaysAgo: 7 },

  { subjectId: "s_sehat", title: "Stok vitamin", priority: "low" },
  { subjectId: "s_sehat", title: "Jadwal cek kesehatan", dueIn: 14, priority: "medium" },

  { subjectId: "s_prop", title: "Revisi latar belakang", done: true, doneDaysAgo: 10 },
  { subjectId: "s_prop", title: "Lengkapi anggaran", dueIn: 20, priority: "medium" },
];

function buildSubjects(now: Date): Subject[] {
  const counters = new Map<string, number>();
  return SUBJECTS.map((seed) => {
    const position = (counters.get(seed.projectId) ?? 0) + 1000;
    counters.set(seed.projectId, position);
    return {
      id: seed.id,
      projectId: seed.projectId,
      name: seed.name,
      color: seed.color,
      position,
      createdAt: isoAgo(now, 30),
    };
  });
}

function buildTasks(now: Date): Task[] {
  const subjectProject = new Map(SUBJECTS.map((subject) => [subject.id, subject.projectId]));
  const counters = new Map<string, number>();
  return TASK_SEEDS.map((seed) => {
    const position = (counters.get(seed.subjectId) ?? 0) + 1000;
    counters.set(seed.subjectId, position);
    const isDone = seed.done ?? false;
    return {
      id: `t_${nanoid(8)}`,
      subjectId: seed.subjectId,
      projectId: subjectProject.get(seed.subjectId)!,
      title: seed.title,
      notes: seed.notes ?? null,
      isDone,
      completedAt: isDone ? isoAgo(now, seed.doneDaysAgo ?? 1) : null,
      completedBy: isDone ? (seed.assigneeId ?? "u_demo") : null,
      assigneeId: seed.assigneeId ?? null,
      dueDate: seed.dueIn === undefined ? null : dayOffset(now, seed.dueIn),
      priority: seed.priority ?? null,
      isArchived: seed.archived ?? false,
      position,
      createdAt: isoAgo(now, 25),
      updatedAt: isoAgo(now, seed.doneDaysAgo ?? Math.floor(Math.random() * 5)),
    } satisfies Task;
  });
}

const INVITES: Invite[] = [
  {
    id: "inv_dita",
    projectId: "p_lbe",
    projectName: "Proyek LBE Kelompok 2",
    email: "dita@example.com",
    role: "editor",
    token: "tc-inv-lbe-dita",
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
  },
  {
    id: "inv_link",
    projectId: "p_personal",
    projectName: "Personal & Habit",
    email: null,
    role: "viewer",
    token: "tc-inv-personal-link",
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
  },
  {
    id: "inv_incoming",
    projectId: "p_foto",
    projectName: "Klub Fotografi Kampus",
    email: "demo@taskcanvas.app",
    role: "editor",
    token: "tc-inv-foto-incoming",
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
  },
];

const ACTIVE_DAYS_AGO: Array<{ daysAgo: number; count: number }> = [
  { daysAgo: 0, count: 1 },
  { daysAgo: 1, count: 3 },
  { daysAgo: 2, count: 2 },
  { daysAgo: 3, count: 1 },
  { daysAgo: 4, count: 4 },
  { daysAgo: 6, count: 2 },
  { daysAgo: 7, count: 1 },
  { daysAgo: 8, count: 3 },
  { daysAgo: 11, count: 1 },
  { daysAgo: 12, count: 2 },
  { daysAgo: 13, count: 1 },
  { daysAgo: 14, count: 3 },
  { daysAgo: 15, count: 1 },
  { daysAgo: 16, count: 2 },
  { daysAgo: 17, count: 1 },
  { daysAgo: 18, count: 4 },
  { daysAgo: 22, count: 1 },
  { daysAgo: 23, count: 2 },
  { daysAgo: 28, count: 1 },
  { daysAgo: 29, count: 1 },
  { daysAgo: 30, count: 3 },
  { daysAgo: 31, count: 2 },
  { daysAgo: 40, count: 1 },
];

function buildActivity(now: Date): ActivityRow[] {
  return ACTIVE_DAYS_AGO.map((entry) => ({
    userId: "u_demo",
    date: dayOffset(now, -entry.daysAgo),
    count: entry.count,
  }));
}

export function createSeedDb(now: Date): MockDb {
  return {
    users: USERS,
    currentUserId: null,
    projects: buildProjects(now),
    members: MEMBERS,
    subjects: buildSubjects(now),
    tasks: buildTasks(now),
    invites: INVITES,
    activity: buildActivity(now),
  };
}
