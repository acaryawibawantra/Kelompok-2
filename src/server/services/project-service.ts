import { and, count, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { getDb } from "@/db/client";
import { projectMembers, projects, subjects, tasks, users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { ProjectDetail } from "@/lib/api";
import type {
  CreateProjectInput,
  Project,
  ProjectScope,
  UpdateProjectInput,
  User,
} from "@/types";
import { requireMember, requireOwner, type Membership } from "@/server/authz";
import { newId } from "@/server/ids";
import { toMember, toProject, toSubject, toTask } from "@/server/mappers";

async function statsForProjects(
  db: Db,
  ids: string[],
): Promise<Map<string, { total: number; done: number }>> {
  const map = new Map<string, { total: number; done: number }>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({ projectId: tasks.projectId, isDone: tasks.isDone })
    .from(tasks)
    .where(and(inArray(tasks.projectId, ids), eq(tasks.isArchived, false)));
  for (const row of rows) {
    const entry = map.get(row.projectId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (row.isDone) entry.done += 1;
    map.set(row.projectId, entry);
  }
  return map;
}

async function memberCounts(db: Db, ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({ projectId: projectMembers.projectId, total: count() })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, ids))
    .groupBy(projectMembers.projectId);
  for (const row of rows) map.set(row.projectId, Number(row.total));
  return map;
}

async function materialize(
  db: Db,
  row: typeof projects.$inferSelect,
  membership: Membership,
): Promise<Project> {
  const [counts, stats] = await Promise.all([
    memberCounts(db, [row.id]),
    statsForProjects(db, [row.id]),
  ]);
  return toProject(row, {
    isFavorite: membership.isFavorite,
    lastOpenedAt: membership.lastOpenedAt,
    memberCount: counts.get(row.id) ?? 1,
    taskStats: stats.get(row.id) ?? { total: 0, done: 0 },
  });
}

export async function listProjects(
  user: User,
  params: { scope: ProjectScope; archived: boolean },
): Promise<Project[]> {
  const db = getDb();
  const memberships = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.userId, user.id));
  const ids = memberships.map((m) => m.projectId);
  if (ids.length === 0) return [];

  const rows = await db
    .select()
    .from(projects)
    .where(and(inArray(projects.id, ids), eq(projects.isArchived, params.archived)));

  const [counts, stats] = await Promise.all([memberCounts(db, ids), statsForProjects(db, ids)]);
  const membershipByProject = new Map(memberships.map((m) => [m.projectId, m]));

  let result = rows.map((row) => {
    const membership = membershipByProject.get(row.id)!;
    return toProject(row, {
      isFavorite: membership.isFavorite,
      lastOpenedAt: membership.lastOpenedAt,
      memberCount: counts.get(row.id) ?? 1,
      taskStats: stats.get(row.id) ?? { total: 0, done: 0 },
    });
  });

  if (params.scope === "favorites") {
    result = result.filter((project) => project.isFavorite);
  }
  if (params.scope === "recent") {
    result.sort(
      (a, b) =>
        (b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0) -
        (a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0),
    );
  } else {
    result.sort((a, b) => a.name.localeCompare(b.name, "id"));
  }
  return result;
}

export async function createProject(user: User, input: CreateProjectInput): Promise<Project> {
  const db = getDb();
  const owned = await db
    .select({ total: count() })
    .from(projectMembers)
    .where(eq(projectMembers.userId, user.id));
  if (Number(owned[0]?.total ?? 0) >= 50) {
    throw new ApiError("CONFLICT", "Batas maksimal 50 project per pengguna tercapai.");
  }

  const id = newId("p");
  const now = new Date();
  const row: typeof projects.$inferSelect = {
    id,
    ownerId: user.id,
    name: input.name,
    emoji: input.emoji ?? null,
    color: input.color,
    description: input.description ?? null,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.batch([
    db.insert(projects).values(row),
    db.insert(projectMembers).values({
      projectId: id,
      userId: user.id,
      role: "owner",
      isFavorite: false,
      lastOpenedAt: now,
      joinedAt: now,
    }),
  ]);
  return materialize(db, row, {
    projectId: id,
    userId: user.id,
    role: "owner",
    isFavorite: false,
    lastOpenedAt: now,
    joinedAt: now,
  });
}

export async function getProjectDetail(user: User, projectId: string): Promise<ProjectDetail> {
  const db = getDb();
  const membership = await requireMember(db, projectId, user.id);

  const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  const row = projectRows[0];
  if (!row) throw new ApiError("NOT_FOUND", "Project tidak ditemukan.");

  if (!row.isArchived) {
    await db
      .update(projectMembers)
      .set({ lastOpenedAt: new Date() })
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)));
  }

  const [subjectRows, taskRows, memberRows] = await Promise.all([
    db.select().from(subjects).where(eq(subjects.projectId, projectId)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.isArchived, false))),
    db
      .select({ member: projectMembers, account: users })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId)),
  ]);

  subjectRows.sort((a, b) => a.position - b.position);
  taskRows.sort((a, b) => a.position - b.position);

  const project = await materialize(db, row, {
    ...membership,
    lastOpenedAt: row.isArchived ? membership.lastOpenedAt : new Date(),
  });

  return {
    project,
    subjects: subjectRows.map(toSubject),
    tasks: taskRows.map(toTask),
    members: memberRows.map((entry) =>
      toMember(entry.member, entry.account, false),
    ),
  };
}

export async function updateProject(
  user: User,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const db = getDb();
  const membership = await requireMember(db, projectId, user.id, "editor");
  const update: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) update.name = input.name;
  if (input.emoji !== undefined) update.emoji = input.emoji;
  if (input.color !== undefined) update.color = input.color;
  if (input.description !== undefined) update.description = input.description;
  await db.update(projects).set(update).where(eq(projects.id, projectId));
  const rows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return materialize(db, rows[0]!, membership);
}

export async function deleteProject(user: User, projectId: string): Promise<void> {
  const db = getDb();
  await requireOwner(db, projectId, user.id);
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function setProjectArchived(
  user: User,
  projectId: string,
  archived: boolean,
): Promise<Project> {
  const db = getDb();
  const membership = await requireOwner(db, projectId, user.id);
  await db
    .update(projects)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  const rows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return materialize(db, rows[0]!, membership);
}

export async function setProjectFavorite(
  user: User,
  projectId: string,
  value: boolean,
): Promise<Project> {
  const db = getDb();
  const membership = await requireMember(db, projectId, user.id);
  await db
    .update(projectMembers)
    .set({ isFavorite: value })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)));
  const rows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return materialize(db, rows[0]!, { ...membership, isFavorite: value });
}
