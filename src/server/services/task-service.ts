import { and, count, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { dailyActivity, projectMembers, projects, subjects, tasks } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { ArchivedTask, DueTask, ScheduledTask, StreakSummary, User } from "@/types";
import { computeStreak, localDay } from "@/lib/streak";
import { positionBetween } from "@/lib/ordering";
import { requireMember } from "@/server/authz";
import { newId } from "@/server/ids";
import { toTask } from "@/server/mappers";
import type { TaskMutationResult } from "@/lib/api";

async function touchProject(projectId: string): Promise<void> {
  const db = getDb();
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
}

async function findTask(id: string): Promise<typeof tasks.$inferSelect> {
  const db = getDb();
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new ApiError("NOT_FOUND", "Task tidak ditemukan.");
  return row;
}

export async function getStreak(user: User): Promise<StreakSummary> {
  const db = getDb();
  const rows = await db.select().from(dailyActivity).where(eq(dailyActivity.userId, user.id));
  return computeStreak({
    activity: rows.map((row) => ({ date: row.date, count: row.completedCount })),
    timezone: user.timezone,
    dailyGoal: user.settings.dailyGoal,
    now: new Date(),
  });
}

export async function createTask(
  user: User,
  subjectId: string,
  input: {
    title: string;
    notes?: string | null;
    dueDate?: string | null;
    priority?: "low" | "medium" | "high" | null;
    assigneeId?: string | null;
  },
) {
  const db = getDb();
  const subjectRows = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1);
  const subject = subjectRows[0];
  if (!subject) throw new ApiError("NOT_FOUND", "Subject tidak ditemukan.");
  await requireMember(db, subject.projectId, user.id, "editor");

  const existing = await db
    .select({ total: count() })
    .from(tasks)
    .where(eq(tasks.projectId, subject.projectId));
  if (Number(existing[0]?.total ?? 0) >= 500) {
    throw new ApiError("CONFLICT", "Batas maksimal 500 task per project tercapai.");
  }

  const siblingRows = await db.select().from(tasks).where(eq(tasks.subjectId, subjectId));
  const last = siblingRows.reduce((max, task) => Math.max(max, task.position), 0);
  const now = new Date();
  const task: typeof tasks.$inferSelect = {
    id: newId("t"),
    projectId: subject.projectId,
    subjectId,
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
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(tasks).values(task);
  await touchProject(subject.projectId);
  return toTask(task);
}

export async function updateTask(
  user: User,
  taskId: string,
  input: {
    title?: string;
    notes?: string | null;
    isDone?: boolean;
    dueDate?: string | null;
    priority?: "low" | "medium" | "high" | null;
    assigneeId?: string | null;
    subjectId?: string;
    position?: number;
    isArchived?: boolean;
  },
): Promise<TaskMutationResult> {
  const db = getDb();
  const task = await findTask(taskId);
  await requireMember(db, task.projectId, user.id, "editor");

  const update: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) update.title = input.title;
  if (input.notes !== undefined) update.notes = input.notes;
  if (input.dueDate !== undefined) update.dueDate = input.dueDate;
  if (input.priority !== undefined) update.priority = input.priority;
  if (input.assigneeId !== undefined) update.assigneeId = input.assigneeId;
  if (input.isArchived !== undefined) update.isArchived = input.isArchived;
  if (input.position !== undefined) update.position = input.position;

  let activityDelta: { date: string; delta: number } | null = null;

  if (input.subjectId !== undefined && input.subjectId !== task.subjectId) {
    const target = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, input.subjectId))
      .limit(1);
    const targetSubject = target[0];
    if (!targetSubject) throw new ApiError("NOT_FOUND", "Subject tujuan tidak ditemukan.");
    await requireMember(db, targetSubject.projectId, user.id, "editor");
    update.subjectId = targetSubject.id;
    update.projectId = targetSubject.projectId;
  }

  if (input.isDone !== undefined && input.isDone !== task.isDone) {
    if (input.isDone) {
      update.isDone = true;
      update.completedAt = new Date();
      update.completedBy = user.id;
      activityDelta = { date: localDay(new Date(), user.timezone), delta: 1 };
    } else {
      const completedDay = task.completedAt
        ? localDay(task.completedAt, user.timezone)
        : localDay(new Date(), user.timezone);
      update.isDone = false;
      update.completedAt = null;
      update.completedBy = null;
      activityDelta = { date: completedDay, delta: -1 };
    }
  }

  if (activityDelta) {
    await db.batch([
      db.update(tasks).set(update).where(eq(tasks.id, taskId)),
      db
        .insert(dailyActivity)
        .values({
          userId: user.id,
          date: activityDelta.date,
          completedCount: activityDelta.delta,
        })
        .onConflictDoUpdate({
          target: [dailyActivity.userId, dailyActivity.date],
          set: {
            completedCount: sql`max(0, ${dailyActivity.completedCount} + ${activityDelta.delta})`,
          },
        }),
    ]);
  } else {
    await db.update(tasks).set(update).where(eq(tasks.id, taskId));
  }

  await touchProject((update.projectId as string | undefined) ?? task.projectId);
  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return { task: toTask(rows[0]!), streak: await getStreak(user) };
}

export async function removeTask(user: User, taskId: string): Promise<{ projectId: string }> {
  const db = getDb();
  const task = await findTask(taskId);
  await requireMember(db, task.projectId, user.id, "editor");
  await db.delete(tasks).where(eq(tasks.id, taskId));
  await touchProject(task.projectId);
  return { projectId: task.projectId };
}

async function allowedProjectIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  return rows.map((row) => row.projectId);
}

export async function listArchivedTasks(user: User): Promise<ArchivedTask[]> {
  const db = getDb();
  const ids = await allowedProjectIds(user.id);
  if (ids.length === 0) return [];
  const rows = await db
    .select({ task: tasks, projectName: projects.name, subjectName: subjects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(subjects, eq(tasks.subjectId, subjects.id))
    .where(and(eq(tasks.isArchived, true), inArray(tasks.projectId, ids)));
  return rows
    .map((row) => ({
      ...toTask(row.task),
      projectName: row.projectName,
      subjectName: row.subjectName,
    }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function listDueTodayTasks(user: User): Promise<DueTask[]> {
  const db = getDb();
  const ids = await allowedProjectIds(user.id);
  if (ids.length === 0) return [];
  const today = localDay(new Date(), user.timezone);
  const rows = await db
    .select({ task: tasks, projectName: projects.name, subjectName: subjects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(subjects, eq(tasks.subjectId, subjects.id))
    .where(
      and(
        eq(tasks.isDone, false),
        eq(tasks.isArchived, false),
        eq(tasks.dueDate, today),
        inArray(tasks.projectId, ids),
      ),
    );
  return rows.map((row) => ({
    ...toTask(row.task),
    projectName: row.projectName,
    subjectName: row.subjectName,
  }));
}

export async function listScheduledTasks(user: User): Promise<ScheduledTask[]> {
  const db = getDb();
  const ids = await allowedProjectIds(user.id);
  if (ids.length === 0) return [];
  const rows = await db
    .select({ task: tasks, projectName: projects.name, subjectName: subjects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(subjects, eq(tasks.subjectId, subjects.id))
    .where(
      and(isNotNull(tasks.dueDate), eq(tasks.isArchived, false), inArray(tasks.projectId, ids)),
    );
  return rows
    .map((row) => ({
      ...toTask(row.task),
      projectName: row.projectName,
      subjectName: row.subjectName,
    }))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}
