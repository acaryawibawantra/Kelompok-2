import type { Invite, Subject, Task, User } from "@/types";
import type { AttendanceRecord, ClassSchedule } from "@/types";
import type { Role } from "@/types";
import { ApiError } from "@/lib/api/errors";
import { createSeedDb } from "./seed";

export interface ProjectRow {
  id: string;
  ownerId: string;
  name: string;
  emoji: string | null;
  color: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberRow {
  projectId: string;
  userId: string;
  role: Role;
  isFavorite: boolean;
  lastOpenedAt: string | null;
  joinedAt: string;
}

export interface ActivityRow {
  userId: string;
  date: string;
  count: number;
}

// Row internal jadwal: bentuk API ditambah userId pemiliknya.
export interface ScheduleRow extends ClassSchedule {
  userId: string;
}

// Row internal presensi: bentuk API ditambah userId pemiliknya.
export interface AttendanceRow extends AttendanceRecord {
  userId: string;
}

export interface MockDb {
  users: User[];
  currentUserId: string | null;
  projects: ProjectRow[];
  members: MemberRow[];
  subjects: Subject[];
  tasks: Task[];
  invites: Invite[];
  activity: ActivityRow[];
  schedules: ScheduleRow[];
  attendance: AttendanceRow[];
}

const STORAGE_KEY = "tc-mock-db-v1";

let cache: MockDb | null = null;

function readStorage(): MockDb | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockDb;
  } catch {
    return null;
  }
}

export function getDb(): MockDb {
  if (cache) return cache;
  const stored = readStorage();
  cache = stored ?? createSeedDb(new Date());
  // Data lama yang tersimpan sebelum fitur jadwal ada belum punya field ini.
  if (!Array.isArray(cache.schedules)) cache.schedules = [];
  if (!Array.isArray(cache.attendance)) cache.attendance = [];
  if (!stored) saveDb(cache);
  return cache;
}

export function saveDb(db: MockDb): void {
  cache = db;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage penuh atau tidak tersedia */
  }
}

export function resetDb(): void {
  cache = createSeedDb(new Date());
  saveDb(cache);
}

export function requireUser(db: MockDb): User {
  const user = db.users.find((item) => item.id === db.currentUserId);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Kamu belum masuk. Silakan login terlebih dahulu.");
  }
  return user;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function simulate(): Promise<void> {
  const latency = 150 + Math.random() * 250;
  await sleep(latency);
  const rawRate = process.env.NEXT_PUBLIC_MOCK_ERROR_RATE ?? "0";
  const rate = Number.parseFloat(rawRate);
  if (Number.isFinite(rate) && rate > 0 && Math.random() < rate) {
    throw new ApiError("INTERNAL", "Terjadi kesalahan pada server tiruan. Coba lagi.");
  }
}
