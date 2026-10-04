import { nanoid } from "nanoid";
import type {
  CreateInviteInput,
  CreateProjectInput,
  CreateSubjectInput,
  CreateTaskInput,
  Invite,
  LoginInput,
  Member,
  Project,
  ProjectScope,
  RegisterInput,
  StreakSummary,
  Subject,
  Task,
  UpdateMeInput,
  UpdateMemberRoleInput,
  UpdateProjectInput,
  UpdateSubjectInput,
  UpdateTaskInput,
  User,
} from "@/types";
import { ApiError } from "@/lib/api/errors";
import { computeStreak, localDay } from "@/lib/streak";
import { colorFromId } from "@/lib/utils";
import { positionBetween } from "@/lib/ordering";
import type { ArchivedTask, DueTask, ScheduledTask } from "@/types";
import type { ProjectDetail, TaskCanvasApi, TaskMutationResult } from "@/lib/api/types";
import { getDb, requireUser, saveDb, simulate, type MockDb, type ProjectRow } from "./store";

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
export type { ActivityRow, MockDb, ProjectRow, MemberRow } from "./store";
