import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projects, subjects, tasks } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { positionBetween } from "@/lib/ordering";
import type { CreateSubjectInput, Subject, UpdateSubjectInput, User } from "@/types";
import { requireMember } from "@/server/authz";
import { newId } from "@/server/ids";
import { toSubject } from "@/server/mappers";

async function touchProject(projectId: string): Promise<void> {
  const db = getDb();
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
}

async function findSubject(id: string): Promise<typeof subjects.$inferSelect> {
  const db = getDb();
  const rows = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new ApiError("NOT_FOUND", "Subject tidak ditemukan.");
  return row;
}

export async function createSubject(
  user: User,
  projectId: string,
  input: CreateSubjectInput,
): Promise<Subject> {
  const db = getDb();
  await requireMember(db, projectId, user.id, "editor");

  const existing = await db
    .select({ total: count() })
    .from(subjects)
    .where(eq(subjects.projectId, projectId));
  if (Number(existing[0]?.total ?? 0) >= 30) {
    throw new ApiError("CONFLICT", "Batas maksimal 30 subject per project tercapai.");
  }

  const rows = await db.select().from(subjects).where(eq(subjects.projectId, projectId));
  const last = rows.reduce((max, subject) => Math.max(max, subject.position), 0);

  const subject: typeof subjects.$inferSelect = {
    id: newId("s"),
    projectId,
    name: input.name,
    color: input.color ?? null,
    position: positionBetween(last || null, null),
    createdAt: new Date(),
  };
  await db.insert(subjects).values(subject);
  await touchProject(projectId);
  return toSubject(subject);
}

export async function updateSubject(
  user: User,
  subjectId: string,
  input: UpdateSubjectInput,
): Promise<Subject> {
  const db = getDb();
  const subject = await findSubject(subjectId);
  await requireMember(db, subject.projectId, user.id, "editor");

  const update: Partial<typeof subjects.$inferInsert> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.color !== undefined) update.color = input.color;
  if (input.position !== undefined) update.position = input.position;
  if (Object.keys(update).length > 0) {
    await db.update(subjects).set(update).where(eq(subjects.id, subjectId));
  }
  await touchProject(subject.projectId);
  const rows = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1);
  return toSubject(rows[0]!);
}

export async function deleteSubject(user: User, subjectId: string): Promise<{ projectId: string }> {
  const db = getDb();
  const subject = await findSubject(subjectId);
  await requireMember(db, subject.projectId, user.id, "editor");
  await db.delete(subjects).where(eq(subjects.id, subjectId));
  await touchProject(subject.projectId);
  return { projectId: subject.projectId };
}

export async function clearCompleted(
  user: User,
  subjectId: string,
): Promise<{ deleted: number; projectId: string }> {
  const db = getDb();
  const subject = await findSubject(subjectId);
  await requireMember(db, subject.projectId, user.id, "editor");
  const removed = await db
    .delete(tasks)
    .where(and(eq(tasks.subjectId, subjectId), eq(tasks.isDone, true), eq(tasks.isArchived, false)))
    .returning({ id: tasks.id });
  await touchProject(subject.projectId);
  return { deleted: removed.length, projectId: subject.projectId };
}
