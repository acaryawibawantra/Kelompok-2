import { nanoid } from "nanoid";
import type {
  AttendanceRecord,
  AttendanceShare,
  AttendanceSummary,
  ClassSchedule,
  CreateAttendanceInput,
  CreateAttendanceShareInput,
  CreateClassScheduleInput,
  CreateInviteInput,
  CreateProjectInput,
  CreateSubjectInput,
  CreateTaskInput,
  Invite,
  LoginInput,
  Member,
  Project,
  ProjectScope,
  PublicRecap,
  RegisterInput,
  StreakSummary,
  Subject,
  Task,
  UpdateAttendanceInput,
  UpdateClassScheduleInput,
  UpdateMeInput,
  UpdateMemberRoleInput,
  UpdateProjectInput,
  UpdateSubjectInput,
  UpdateTaskInput,
  User,
} from "@/types";
import { ApiError } from "@/lib/api/errors";
import { computeAttendanceSummary } from "@/lib/attendance";
import { computeStreak, localDay } from "@/lib/streak";
import { colorFromId } from "@/lib/utils";
import { positionBetween } from "@/lib/ordering";
import type { ArchivedTask, DueTask, ScheduledTask } from "@/types";
import type { ProjectDetail, TaskCanvasApi, TaskMutationResult } from "@/lib/api/types";
import { addDays, format, parseISO } from "date-fns";
import {
  getDb,
  requireUser,
  saveDb,
  simulate,
  type AttendanceRow,
  type MockDb,
  type ProjectRow,
  type ScheduleRow,
} from "./store";

function nowIso(): string {
  return new Date().toISOString();
}

function materializeProject(db: MockDb, row: ProjectRow, userId: string): Project {
  const membership = db.members.find((m) => m.projectId === row.id && m.userId === userId);
  const projectTasks = db.tasks.filter((task) => task.projectId === row.id && !task.isArchived);
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    ownerId: row.ownerId,
    isFavorite: membership?.isFavorite ?? false,
    isArchived: row.isArchived,
    lastOpenedAt: membership?.lastOpenedAt ?? null,
    memberCount: db.members.filter((m) => m.projectId === row.id).length,
    taskStats: {
      total: projectTasks.length,
      done: projectTasks.filter((task) => task.isDone).length,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireMembership(db: MockDb, projectId: string, userId: string) {
  const membership = db.members.find((m) => m.projectId === projectId && m.userId === userId);
  if (!membership) {
    throw new ApiError("NOT_FOUND", "Project tidak ditemukan atau kamu bukan anggotanya.");
  }
  return membership;
}

function touchProject(db: MockDb, projectId: string): void {
  const project = db.projects.find((p) => p.id === projectId);
  if (project) project.updatedAt = nowIso();
}

function adjustActivity(db: MockDb, userId: string, date: string, delta: number): void {
  const existing = db.activity.find((row) => row.userId === userId && row.date === date);
  if (existing) {
    existing.count = Math.max(0, existing.count + delta);
    return;
  }
  if (delta > 0) {
    db.activity.push({ userId, date, count: delta });
  }
}

function streakFor(db: MockDb, user: User): StreakSummary {
  return computeStreak({
    activity: db.activity
      .filter((row) => row.userId === user.id)
      .map((row) => ({ date: row.date, count: row.count })),
    timezone: user.timezone,
    dailyGoal: user.settings.dailyGoal,
    now: new Date(),
  });
}

function findProject(db: MockDb, id: string): ProjectRow {
  const project = db.projects.find((item) => item.id === id);
  if (!project) throw new ApiError("NOT_FOUND", "Project tidak ditemukan.");
  return project;
}

function findSubject(db: MockDb, id: string): Subject {
  const subject = db.subjects.find((item) => item.id === id);
  if (!subject) throw new ApiError("NOT_FOUND", "Subject tidak ditemukan.");
  return subject;
}

function findTask(db: MockDb, id: string): Task {
  const task = db.tasks.find((item) => item.id === id);
  if (!task) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
  return task;
}

function mondayFirst(weekday: number): number {
  return (weekday + 6) % 7;
}

function sortSchedules<T extends { weekday: number; start: string }>(schedules: T[]): T[] {
  return [...schedules].sort(
    (a, b) => mondayFirst(a.weekday) - mondayFirst(b.weekday) || a.start.localeCompare(b.start),
  );
}

// Buang field internal userId → bentuk publik sesuai skema API.
function toPublicSchedule(row: ScheduleRow): ClassSchedule {
  return {
    id: row.id,
    weekday: row.weekday,
    start: row.start,
    end: row.end,
    course: row.course,
    room: row.room,
    createdAt: row.createdAt,
  };
}

function findSchedule(db: MockDb, userId: string, id: string): ScheduleRow {
  const schedule = db.schedules.find((item) => item.id === id && item.userId === userId);
  if (!schedule) throw new ApiError("NOT_FOUND", "Jadwal tidak ditemukan.");
  return schedule;
}

// Buang field internal userId -> bentuk publik sesuai skema API.
function toPublicAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    scheduleId: row.scheduleId,
    date: row.date,
    status: row.status,
    course: row.course,
    room: row.room,
    photo: row.photo,
    note: row.note,
    checkedInAt: row.checkedInAt,
    createdAt: row.createdAt,
  };
}

function findAttendance(db: MockDb, userId: string, id: string): AttendanceRow {
  const record = db.attendance.find((item) => item.id === id && item.userId === userId);
  if (!record) throw new ApiError("NOT_FOUND", "Catatan presensi tidak ditemukan.");
  return record;
}

function requiresProof(status: string): boolean {
  return status === "present" || status === "late";
}

export const mockApi: TaskCanvasApi = {
  auth: {
    async register(input: RegisterInput) {
      await simulate();
      const db = getDb();
      const email = input.email.toLowerCase();
      if (db.users.some((user) => user.email.toLowerCase() === email)) {
        throw new ApiError("CONFLICT", "Email sudah terdaftar.", {
          email: "Email sudah terdaftar.",
        });
      }
      const user: User = {
        id: `u_${nanoid(8)}`,
        name: input.name,
        email,
        avatarColor: colorFromId(email),
        timezone: "Asia/Jakarta",
        settings: { titleFont: "modern", theme: "system", dailyGoal: 3 },
        createdAt: nowIso(),
      };
      db.users.push(user);
      db.currentUserId = user.id;
      saveDb(db);
      return user;
    },

    async login(input: LoginInput) {
      await simulate();
      const db = getDb();
      const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
      if (!user || input.password.length < 8) {
        throw new ApiError("UNAUTHORIZED", "Email atau password salah.");
      }
      db.currentUserId = user.id;
      saveDb(db);
      return user;
    },

    async logout() {
      await simulate();
      const db = getDb();
      db.currentUserId = null;
      saveDb(db);
    },

    async me() {
      await simulate();
      const db = getDb();
      if (!db.currentUserId) return null;
      return db.users.find((user) => user.id === db.currentUserId) ?? null;
    },

    async updateMe(input: UpdateMeInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      if (input.name !== undefined) user.name = input.name;
      if (input.timezone !== undefined) user.timezone = input.timezone;
      if (input.settings) {
        user.settings = { ...user.settings, ...input.settings };
      }
      saveDb(db);
      return user;
    },
  },

  projects: {
    async list(params) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const scope: ProjectScope = params?.scope ?? "all";
      const archived = params?.archived ?? false;
      const memberships = db.members.filter((m) => m.userId === user.id);
      const memberByProject = new Map(memberships.map((m) => [m.projectId, m]));

      let projects = db.projects.filter((row) => memberByProject.has(row.id));
      projects = projects.filter((row) => row.isArchived === archived);

      if (scope === "favorites") {
        projects = projects.filter((row) => memberByProject.get(row.id)?.isFavorite);
      }

      const materialized = projects.map((row) => materializeProject(db, row, user.id));

      if (scope === "recent") {
        materialized.sort((a, b) => {
          const aTime = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0;
          const bTime = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0;
          return bTime - aTime;
        });
      } else {
        materialized.sort((a, b) => a.name.localeCompare(b.name, "id"));
      }

      return materialized;
    },

    async create(input: CreateProjectInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const count = db.members.filter((m) => m.userId === user.id).length;
      if (count >= 50) {
        throw new ApiError("CONFLICT", "Batas maksimal 50 project per pengguna tercapai.");
      }
      const id = `p_${nanoid(8)}`;
      const timestamp = nowIso();
      const row: ProjectRow = {
        id,
        ownerId: user.id,
        name: input.name,
        emoji: input.emoji ?? null,
        color: input.color,
        description: input.description ?? null,
        isArchived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.projects.push(row);
      db.members.push({
        projectId: id,
        userId: user.id,
        role: "owner",
        isFavorite: false,
        lastOpenedAt: timestamp,
        joinedAt: timestamp,
      });
      saveDb(db);
      return materializeProject(db, row, user.id);
    },

    async get(id: string): Promise<ProjectDetail> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, id, user.id);
      const row = findProject(db, id);
      if (!row.isArchived) {
        membership.lastOpenedAt = nowIso();
      }
      const members = db.members
        .filter((m) => m.projectId === id)
        .map((m) => {
          const memberUser = db.users.find((u) => u.id === m.userId)!;
          return {
            userId: m.userId,
            name: memberUser.name,
            email: memberUser.email,
            avatarColor: memberUser.avatarColor,
            role: m.role,
            joinedAt: m.joinedAt,
            online: m.userId !== user.id && m.userId === "u_sinta",
          } satisfies Member;
        });
      saveDb(db);
      return {
        project: materializeProject(db, row, user.id),
        subjects: db.subjects
          .filter((subject) => subject.projectId === id)
          .sort((a, b) => a.position - b.position),
        tasks: db.tasks
          .filter((task) => task.projectId === id && !task.isArchived)
          .sort((a, b) => a.position - b.position),
        members,
      };
    },

    async update(id: string, input: UpdateProjectInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, id, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat mengubah project.");
      }
      const row = findProject(db, id);
      if (input.name !== undefined) row.name = input.name;
      if (input.emoji !== undefined) row.emoji = input.emoji;
      if (input.color !== undefined) row.color = input.color;
      if (input.description !== undefined) row.description = input.description;
      row.updatedAt = nowIso();
      saveDb(db);
      return materializeProject(db, row, user.id);
    },

    async remove(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const row = findProject(db, id);
      if (row.ownerId !== user.id) {
        throw new ApiError("FORBIDDEN", "Hanya owner yang dapat menghapus project.");
      }
      db.projects = db.projects.filter((project) => project.id !== id);
      db.members = db.members.filter((member) => member.projectId !== id);
      db.subjects = db.subjects.filter((subject) => subject.projectId !== id);
      db.tasks = db.tasks.filter((task) => task.projectId !== id);
      db.invites = db.invites.filter((invite) => invite.projectId !== id);
      saveDb(db);
    },

    async setArchived(id: string, archived: boolean) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const row = findProject(db, id);
      if (row.ownerId !== user.id) {
        throw new ApiError("FORBIDDEN", "Hanya owner yang dapat mengarsipkan project.");
      }
      row.isArchived = archived;
      row.updatedAt = nowIso();
      saveDb(db);
      return materializeProject(db, row, user.id);
    },

    async setFavorite(id: string, value: boolean) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, id, user.id);
      membership.isFavorite = value;
      saveDb(db);
      return materializeProject(db, findProject(db, id), user.id);
    },
  },

  subjects: {
    async create(projectId: string, input: CreateSubjectInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat menambah subject.");
      }
      const projectSubjects = db.subjects.filter((s) => s.projectId === projectId);
      if (projectSubjects.length >= 30) {
        throw new ApiError("CONFLICT", "Batas maksimal 30 subject per project tercapai.");
      }
      const last = projectSubjects.reduce((max, s) => Math.max(max, s.position), 0);
      const subject: Subject = {
        id: `s_${nanoid(8)}`,
        projectId,
        name: input.name,
        color: input.color ?? null,
        position: positionBetween(last || null, null),
        createdAt: nowIso(),
      };
      db.subjects.push(subject);
      touchProject(db, projectId);
      saveDb(db);
      return subject;
    },

    async update(id: string, input: UpdateSubjectInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const subject = findSubject(db, id);
      const membership = requireMembership(db, subject.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat mengubah subject.");
      }
      if (input.name !== undefined) subject.name = input.name;
      if (input.color !== undefined) subject.color = input.color;
      if (input.position !== undefined) subject.position = input.position;
      touchProject(db, subject.projectId);
      saveDb(db);
      return subject;
    },

    async remove(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const subject = findSubject(db, id);
      const membership = requireMembership(db, subject.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat menghapus subject.");
      }
      db.subjects = db.subjects.filter((item) => item.id !== id);
      db.tasks = db.tasks.filter((task) => task.subjectId !== id);
      touchProject(db, subject.projectId);
      saveDb(db);
    },

    async clearCompleted(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const subject = findSubject(db, id);
      const membership = requireMembership(db, subject.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat menghapus task.");
      }
      const before = db.tasks.length;
      db.tasks = db.tasks.filter(
        (task) => !(task.subjectId === id && task.isDone && !task.isArchived),
      );
      touchProject(db, subject.projectId);
      saveDb(db);
      return { deleted: before - db.tasks.length };
    },
  },

  tasks: {
    async create(subjectId: string, input: CreateTaskInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const subject = findSubject(db, subjectId);
      const membership = requireMembership(db, subject.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat menambah task.");
      }
      const projectTaskCount = db.tasks.filter((t) => t.projectId === subject.projectId).length;
      if (projectTaskCount >= 500) {
        throw new ApiError("CONFLICT", "Batas maksimal 500 task per project tercapai.");
      }
      const subjectTasks = db.tasks.filter((task) => task.subjectId === subjectId);
      const last = subjectTasks.reduce((max, task) => Math.max(max, task.position), 0);
      const timestamp = nowIso();
      const task: Task = {
        id: `t_${nanoid(8)}`,
        subjectId,
        projectId: subject.projectId,
        title: input.title,
        notes: input.notes ?? null,
        isDone: false,
        completedAt: null,
        completedBy: null,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        priority: input.priority ?? null,
        isArchived: false,
        position: positionBetween(last || null, null),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.tasks.push(task);
      touchProject(db, subject.projectId);
      saveDb(db);
      return task;
    },

    async update(id: string, input: UpdateTaskInput): Promise<TaskMutationResult> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const task = findTask(db, id);
      const membership = requireMembership(db, task.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat mengubah task.");
      }

      const previousDone = task.isDone;
      if (input.title !== undefined) task.title = input.title;
      if (input.notes !== undefined) task.notes = input.notes;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate;
      if (input.priority !== undefined) task.priority = input.priority;
      if (input.assigneeId !== undefined) task.assigneeId = input.assigneeId;
      if (input.isArchived !== undefined) task.isArchived = input.isArchived;
      if (input.position !== undefined) task.position = input.position;
      if (input.subjectId !== undefined) {
        const target = findSubject(db, input.subjectId);
        task.subjectId = target.id;
        task.projectId = target.projectId;
      }

      if (input.isDone !== undefined && input.isDone !== previousDone) {
        if (input.isDone) {
          task.isDone = true;
          task.completedAt = nowIso();
          task.completedBy = user.id;
          adjustActivity(db, user.id, localDay(new Date(), user.timezone), 1);
        } else {
          const completedDay = task.completedAt
            ? localDay(new Date(task.completedAt), user.timezone)
            : localDay(new Date(), user.timezone);
          task.isDone = false;
          task.completedAt = null;
          task.completedBy = null;
          adjustActivity(db, user.id, completedDay, -1);
        }
      }

      task.updatedAt = nowIso();
      touchProject(db, task.projectId);
      saveDb(db);
      return { task, streak: streakFor(db, user) };
    },

    async remove(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const task = findTask(db, id);
      const membership = requireMembership(db, task.projectId, user.id);
      if (membership.role === "viewer") {
        throw new ApiError("FORBIDDEN", "Viewer tidak dapat menghapus task.");
      }
      db.tasks = db.tasks.filter((item) => item.id !== id);
      touchProject(db, task.projectId);
      saveDb(db);
    },

    async listArchived(): Promise<ArchivedTask[]> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const allowed = new Set(
        db.members.filter((m) => m.userId === user.id).map((m) => m.projectId),
      );
      return db.tasks
        .filter((task) => task.isArchived && allowed.has(task.projectId))
        .map((task) => ({
          ...task,
          projectName: db.projects.find((p) => p.id === task.projectId)?.name ?? "Tanpa project",
          subjectName: db.subjects.find((s) => s.id === task.subjectId)?.name ?? "Tanpa subject",
        }))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    },

    async listDueToday(): Promise<DueTask[]> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const allowed = new Set(
        db.members.filter((m) => m.userId === user.id).map((m) => m.projectId),
      );
      const today = localDay(new Date(), user.timezone);
      return db.tasks
        .filter(
          (task) =>
            !task.isDone &&
            !task.isArchived &&
            task.dueDate === today &&
            allowed.has(task.projectId),
        )
        .map((task) => ({
          ...task,
          projectName: db.projects.find((p) => p.id === task.projectId)?.name ?? "Tanpa project",
          subjectName: db.subjects.find((s) => s.id === task.subjectId)?.name ?? "Tanpa subject",
        }));
    },

    async listScheduled(): Promise<ScheduledTask[]> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const allowed = new Set(
        db.members.filter((m) => m.userId === user.id).map((m) => m.projectId),
      );
      return db.tasks
        .filter((task) => task.dueDate !== null && !task.isArchived && allowed.has(task.projectId))
        .map((task) => ({
          ...task,
          projectName: db.projects.find((p) => p.id === task.projectId)?.name ?? "Tanpa project",
          subjectName: db.subjects.find((s) => s.id === task.subjectId)?.name ?? "Tanpa subject",
        }))
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    },
  },

  members: {
    async list(projectId: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      requireMembership(db, projectId, user.id);
      return db.members
        .filter((m) => m.projectId === projectId)
        .map((m) => {
          const memberUser = db.users.find((u) => u.id === m.userId)!;
          return {
            userId: m.userId,
            name: memberUser.name,
            email: memberUser.email,
            avatarColor: memberUser.avatarColor,
            role: m.role,
            joinedAt: m.joinedAt,
            online: m.userId !== user.id && m.userId === "u_sinta",
          } satisfies Member;
        });
    },

    async updateRole(projectId: string, userId: string, input: UpdateMemberRoleInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, projectId, user.id);
      if (membership.role !== "owner") {
        throw new ApiError("FORBIDDEN", "Hanya owner yang dapat mengubah peran anggota.");
      }
      const target = db.members.find((m) => m.projectId === projectId && m.userId === userId);
      if (!target) throw new ApiError("NOT_FOUND", "Anggota tidak ditemukan.");
      if (target.role === "owner") {
        throw new ApiError("FORBIDDEN", "Peran owner tidak dapat diubah.");
      }
      target.role = input.role;
      const memberUser = db.users.find((u) => u.id === userId)!;
      saveDb(db);
      return {
        userId,
        name: memberUser.name,
        email: memberUser.email,
        avatarColor: memberUser.avatarColor,
        role: target.role,
        joinedAt: target.joinedAt,
      } satisfies Member;
    },

    async remove(projectId: string, userId: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, projectId, user.id);
      const isSelf = user.id === userId;
      if (membership.role !== "owner" && !isSelf) {
        throw new ApiError("FORBIDDEN", "Kamu tidak berhak mengeluarkan anggota ini.");
      }
      const target = db.members.find((m) => m.projectId === projectId && m.userId === userId);
      if (target?.role === "owner") {
        throw new ApiError("FORBIDDEN", "Owner tidak dapat keluar dari project miliknya.");
      }
      db.members = db.members.filter((m) => !(m.projectId === projectId && m.userId === userId));
      saveDb(db);
    },
  },

  invites: {
    async list() {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      return db.invites.filter(
        (invite) =>
          invite.status === "pending" &&
          invite.email !== null &&
          invite.email.toLowerCase() === user.email.toLowerCase(),
      );
    },

    async listForProject(projectId: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      requireMembership(db, projectId, user.id);
      return db.invites.filter(
        (invite) => invite.projectId === projectId && invite.status === "pending",
      );
    },

    async create(projectId: string, input: CreateInviteInput) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const membership = requireMembership(db, projectId, user.id);
      if (membership.role !== "owner") {
        throw new ApiError("FORBIDDEN", "Hanya owner yang dapat mengundang anggota.");
      }
      const project = findProject(db, projectId);
      const email = input.email ? input.email.toLowerCase() : null;
      if (email && db.users.some((u) => u.email.toLowerCase() === email)) {
        const already = db.members.some(
          (m) =>
            m.projectId === projectId &&
            db.users.find((u) => u.id === m.userId)?.email.toLowerCase() === email,
        );
        if (already) {
          throw new ApiError("CONFLICT", "Pengguna tersebut sudah menjadi anggota.");
        }
      }
      const invite: Invite = {
        id: `inv_${nanoid(8)}`,
        projectId,
        projectName: project.name,
        email,
        role: input.role,
        token: `tc-inv-${nanoid(16)}`,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      };
      db.invites.push(invite);
      saveDb(db);
      return invite;
    },

    async revoke(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const invite = db.invites.find((item) => item.id === id);
      if (!invite) throw new ApiError("NOT_FOUND", "Undangan tidak ditemukan.");
      const membership = requireMembership(db, invite.projectId, user.id);
      if (membership.role !== "owner") {
        throw new ApiError("FORBIDDEN", "Hanya owner yang dapat mencabut undangan.");
      }
      invite.status = "revoked";
      saveDb(db);
    },

    async accept(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const invite = db.invites.find((item) => item.id === id);
      if (!invite || invite.status !== "pending") {
        throw new ApiError("NOT_FOUND", "Undangan tidak ditemukan atau sudah tidak berlaku.");
      }
      invite.status = "accepted";
      addMemberFromInvite(db, invite, user.id);
      saveDb(db);
    },

    async decline(id: string) {
      await simulate();
      const db = getDb();
      requireUser(db);
      const invite = db.invites.find((item) => item.id === id);
      if (!invite || invite.status !== "pending") {
        throw new ApiError("NOT_FOUND", "Undangan tidak ditemukan atau sudah tidak berlaku.");
      }
      invite.status = "declined";
      saveDb(db);
    },

    async join(token: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const invite = db.invites.find((item) => item.token === token && item.status === "pending");
      if (!invite) {
        throw new ApiError("NOT_FOUND", "Tautan undangan tidak valid atau sudah kedaluwarsa.");
      }
      invite.status = "accepted";
      addMemberFromInvite(db, invite, user.id);
      saveDb(db);
      return { projectId: invite.projectId };
    },
  },

  streak: {
    async get() {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      return streakFor(db, user);
    },
  },

  schedules: {
    async list(): Promise<ClassSchedule[]> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      return sortSchedules(db.schedules.filter((item) => item.userId === user.id)).map(
        toPublicSchedule,
      );
    },

    async create(input: CreateClassScheduleInput): Promise<ClassSchedule> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      if (db.schedules.filter((item) => item.userId === user.id).length >= 100) {
        throw new ApiError("CONFLICT", "Batas maksimal 100 jadwal kuliah tercapai.");
      }
      const row: ScheduleRow = {
        id: `cs_${nanoid(8)}`,
        userId: user.id,
        weekday: input.weekday,
        start: input.start,
        end: input.end,
        course: input.course,
        room: input.room ?? null,
        createdAt: nowIso(),
      };
      db.schedules.push(row);
      saveDb(db);
      return toPublicSchedule(row);
    },

    async createMany(items: CreateClassScheduleInput[]): Promise<ClassSchedule[]> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      if (db.schedules.filter((item) => item.userId === user.id).length + items.length > 100) {
        throw new ApiError("CONFLICT", "Impor melebihi batas maksimal 100 jadwal kuliah.");
      }
      const rows: ScheduleRow[] = items.map((item) => ({
        id: `cs_${nanoid(8)}`,
        userId: user.id,
        weekday: item.weekday,
        start: item.start,
        end: item.end,
        course: item.course,
        room: item.room ?? null,
        createdAt: nowIso(),
      }));
      db.schedules.push(...rows);
      saveDb(db);
      return rows.map(toPublicSchedule);
    },

    async update(id: string, input: UpdateClassScheduleInput): Promise<ClassSchedule> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const row = findSchedule(db, user.id, id);
      if (input.weekday !== undefined) row.weekday = input.weekday;
      if (input.start !== undefined) row.start = input.start;
      if (input.end !== undefined) row.end = input.end;
      if (input.course !== undefined) row.course = input.course;
      if (input.room !== undefined) row.room = input.room;
      saveDb(db);
      return toPublicSchedule(row);
    },

    async remove(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      findSchedule(db, user.id, id);
      db.schedules = db.schedules.filter((item) => item.id !== id);
      saveDb(db);
    },

    async removeAll() {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      db.schedules = db.schedules.filter((item) => item.userId !== user.id);
      saveDb(db);
    },
  },

  attendance: {
    async list(range) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      return db.attendance
        .filter(
          (item) =>
            item.userId === user.id &&
            (!range?.from || item.date >= range.from) &&
            (!range?.to || item.date <= range.to),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.checkedInAt.localeCompare(a.checkedInAt))
        .map(toPublicAttendance);
    },

    async checkIn(input: CreateAttendanceInput): Promise<AttendanceRecord> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      if (input.date > localDay(new Date(), user.timezone)) {
        throw new ApiError("VALIDATION_ERROR", "Tanggal presensi tidak boleh di masa depan.");
      }

      let course = input.course ?? "";
      let room = input.room ?? null;

      if (input.scheduleId) {
        const schedule = findSchedule(db, user.id, input.scheduleId);
        course = schedule.course;
        room = schedule.room;
      }
      if (course.trim() === "") {
        throw new ApiError("VALIDATION_ERROR", "Mata kuliah wajib diisi.");
      }

      const existing = input.scheduleId
        ? db.attendance.find(
            (item) =>
              item.userId === user.id &&
              item.scheduleId === input.scheduleId &&
              item.date === input.date,
          )
        : undefined;

      if (existing) {
        existing.status = input.status;
        existing.photo = input.photo ?? null;
        existing.note = input.note ?? null;
        existing.course = course;
        existing.room = room;
        existing.checkedInAt = nowIso();
        saveDb(db);
        return toPublicAttendance(existing);
      }

      const row: AttendanceRow = {
        id: `at_${nanoid(8)}`,
        userId: user.id,
        scheduleId: input.scheduleId ?? null,
        date: input.date,
        status: input.status,
        course,
        room,
        photo: input.photo ?? null,
        note: input.note ?? null,
        checkedInAt: nowIso(),
        createdAt: nowIso(),
      };
      db.attendance.push(row);
      saveDb(db);
      return toPublicAttendance(row);
    },

    async update(id: string, input: UpdateAttendanceInput): Promise<AttendanceRecord> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const row = findAttendance(db, user.id, id);
      const nextStatus = input.status ?? row.status;
      const nextPhoto = input.photo !== undefined ? input.photo : row.photo;
      if (requiresProof(nextStatus) && !nextPhoto) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Foto bukti wajib untuk status Hadir atau Terlambat.",
        );
      }
      if (input.status !== undefined) row.status = input.status;
      if (input.photo !== undefined) row.photo = input.photo;
      if (input.note !== undefined) row.note = input.note;
      saveDb(db);
      return toPublicAttendance(row);
    },

    async remove(id: string) {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      findAttendance(db, user.id, id);
      db.attendance = db.attendance.filter((item) => item.id !== id);
      saveDb(db);
    },

    async summary(): Promise<AttendanceSummary> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      return computeAttendanceSummary({
        records: db.attendance
          .filter((item) => item.userId === user.id)
          .map((item) => ({ date: item.date, status: item.status, course: item.course })),
        schedules: db.schedules
          .filter((item) => item.userId === user.id)
          .map((item) => ({ weekday: item.weekday, course: item.course })),
        timezone: user.timezone,
        now: new Date(),
      });
    },

    async share(input: CreateAttendanceShareInput): Promise<AttendanceShare> {
      await simulate();
      const db = getDb();
      const user = requireUser(db);
      const existing = db.shares.find(
        (item) => item.userId === user.id && item.weekStart === input.weekStart,
      );
      if (existing) return { token: existing.token, path: `/r/${existing.token}` };
      const token = `tc-recap-${nanoid(22)}`;
      db.shares.push({
        id: `sh_${nanoid(8)}`,
        userId: user.id,
        weekStart: input.weekStart,
        token,
        createdAt: nowIso(),
      });
      saveDb(db);
      return { token, path: `/r/${token}` };
    },

    async recap(token: string): Promise<PublicRecap> {
      await simulate();
      const db = getDb();
      const share = db.shares.find((item) => item.token === token);
      if (!share) {
        throw new ApiError("NOT_FOUND", "Rekap tidak ditemukan atau tautan tidak valid.");
      }
      const user = db.users.find((item) => item.id === share.userId);
      if (!user) throw new ApiError("NOT_FOUND", "Pengguna tidak ditemukan.");

      const weekEnd = format(addDays(parseISO(`${share.weekStart}T00:00:00Z`), 6), "yyyy-MM-dd");
      const records = db.attendance
        .filter(
          (item) =>
            item.userId === user.id && item.date >= share.weekStart && item.date <= weekEnd,
        )
        .sort(
          (a, b) => b.date.localeCompare(a.date) || b.checkedInAt.localeCompare(a.checkedInAt),
        )
        .map(toPublicAttendance);

      const summary = computeAttendanceSummary({
        records: records.map((item) => ({
          date: item.date,
          status: item.status,
          course: item.course,
        })),
        schedules: db.schedules
          .filter((item) => item.userId === user.id)
          .map((item) => ({ weekday: item.weekday, course: item.course })),
        timezone: user.timezone,
        now: new Date(`${weekEnd}T12:00:00Z`),
      });

      return {
        name: user.name,
        avatarColor: user.avatarColor,
        weekStart: share.weekStart,
        summary,
        records,
      };
    },
  },
};

function addMemberFromInvite(db: MockDb, invite: Invite, userId: string): void {
  const exists = db.members.some(
    (member) => member.projectId === invite.projectId && member.userId === userId,
  );
  if (exists) return;
  db.members.push({
    projectId: invite.projectId,
    userId,
    role: invite.role,
    isFavorite: false,
    lastOpenedAt: null,
    joinedAt: nowIso(),
  });
}

export { resetDb } from "./store";
export type {
  ActivityRow,
  MockDb,
  ProjectRow,
  MemberRow,
  ScheduleRow,
  AttendanceRow,
} from "./store";
