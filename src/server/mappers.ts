import type { InferSelectModel } from "drizzle-orm";
import type {
  projectInvites,
  projectMembers,
  projects,
  subjects,
  tasks,
  users,
} from "@/db/schema";
import type {
  Invite,
  Member,
  Project,
  Role,
  Subject,
  Task,
  User,
} from "@/types";

type UserRow = InferSelectModel<typeof users>;
type ProjectRow = InferSelectModel<typeof projects>;
type MemberRow = InferSelectModel<typeof projectMembers>;
type SubjectRow = InferSelectModel<typeof subjects>;
type TaskRow = InferSelectModel<typeof tasks>;
type InviteRow = InferSelectModel<typeof projectInvites>;

export function toIso(date: Date): string {
  return date.toISOString();
}

export function toIsoOrNull(date: Date | null): string | null {
  return date === null ? null : date.toISOString();
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarColor: row.avatarColor,
    timezone: row.timezone,
    settings: {
      titleFont: row.titleFont as User["settings"]["titleFont"],
      theme: row.theme as User["settings"]["theme"],
      dailyGoal: row.dailyGoal,
    },
    createdAt: toIso(row.createdAt),
  };
}

export interface ProjectExtras {
  isFavorite: boolean;
  lastOpenedAt: Date | null;
  memberCount: number;
  taskStats: { total: number; done: number };
}

export function toProject(row: ProjectRow, extras: ProjectExtras): Project {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    ownerId: row.ownerId,
    isFavorite: extras.isFavorite,
    isArchived: row.isArchived,
    lastOpenedAt: toIsoOrNull(extras.lastOpenedAt),
    memberCount: extras.memberCount,
    taskStats: extras.taskStats,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    color: row.color,
    position: row.position,
    createdAt: toIso(row.createdAt),
  };
}

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    subjectId: row.subjectId,
    projectId: row.projectId,
    title: row.title,
    notes: row.notes,
    isDone: row.isDone,
    completedAt: toIsoOrNull(row.completedAt),
    completedBy: row.completedBy,
    assigneeId: row.assigneeId,
    dueDate: row.dueDate,
    priority: row.priority as Task["priority"],
    isArchived: row.isArchived,
    position: row.position,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toMember(
  row: MemberRow,
  user: Pick<UserRow, "id" | "name" | "email" | "avatarColor">,
  online: boolean,
): Member {
  return {
    userId: row.userId,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    role: row.role as Role,
    joinedAt: toIso(row.joinedAt),
    online,
  };
}

export function toInvite(row: InviteRow, projectName: string): Invite {
  return {
    id: row.id,
    projectId: row.projectId,
    projectName,
    email: row.email,
    role: row.role,
    token: row.token,
    status: row.status,
    expiresAt: toIso(row.expiresAt),
  };
}
