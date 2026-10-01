import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { projectMembers } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { Role } from "@/types";

const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

export interface Membership {
  projectId: string;
  userId: string;
  role: Role;
  isFavorite: boolean;
  lastOpenedAt: Date | null;
  joinedAt: Date;
}

export async function getMembership(
  db: Db,
  projectId: string,
  userId: string,
): Promise<Membership | null> {
  const rows = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    projectId: row.projectId,
    userId: row.userId,
    role: row.role as Role,
    isFavorite: row.isFavorite,
    lastOpenedAt: row.lastOpenedAt,
    joinedAt: row.joinedAt,
  };
}

export async function requireMember(
  db: Db,
  projectId: string,
  userId: string,
  minRole: Role = "viewer",
): Promise<Membership> {
  const membership = await getMembership(db, projectId, userId);
  if (!membership) {
    throw new ApiError("NOT_FOUND", "Project tidak ditemukan atau kamu bukan anggotanya.");
  }
  if (RANK[membership.role] < RANK[minRole]) {
    throw new ApiError("FORBIDDEN", "Kamu tidak memiliki akses untuk aksi ini.");
  }
  return membership;
}

export async function requireOwner(db: Db, projectId: string, userId: string): Promise<Membership> {
  return requireMember(db, projectId, userId, "owner");
}
