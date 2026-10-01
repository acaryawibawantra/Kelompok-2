import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInvites, projectMembers, projects, users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { CreateInviteInput, Invite, Member, Role, UpdateMemberRoleInput, User } from "@/types";
import { requireMember, requireOwner } from "@/server/authz";
import { newId, newToken } from "@/server/ids";
import { toInvite, toMember } from "@/server/mappers";

export async function listMembers(user: User, projectId: string): Promise<Member[]> {
  const db = getDb();
  await requireMember(db, projectId, user.id);
  const rows = await db
    .select({ member: projectMembers, account: users })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));
  return rows.map((row) => toMember(row.member, row.account, false));
}

export async function updateMemberRole(
  user: User,
  projectId: string,
  targetUserId: string,
  input: UpdateMemberRoleInput,
): Promise<Member> {
  const db = getDb();
  await requireOwner(db, projectId, user.id);
  const rows = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)),
    )
    .limit(1);
  const target = rows[0];
  if (!target) throw new ApiError("NOT_FOUND", "Anggota tidak ditemukan.");
  if (target.role === "owner") {
    throw new ApiError("FORBIDDEN", "Peran owner tidak dapat diubah.");
  }
  await db
    .update(projectMembers)
    .set({ role: input.role })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)));
  const accountRows = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  return toMember({ ...target, role: input.role }, accountRows[0]!, false);
}

export async function removeMember(
  user: User,
  projectId: string,
  targetUserId: string,
): Promise<void> {
  const db = getDb();
  const membership = await requireMember(db, projectId, user.id);
  const isSelf = user.id === targetUserId;
  if (membership.role !== "owner" && !isSelf) {
    throw new ApiError("FORBIDDEN", "Kamu tidak berhak mengeluarkan anggota ini.");
  }
  const rows = await db
    .select()
    .from(projectMembers)
    .where(
      and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)),
    )
    .limit(1);
  const target = rows[0];
  if (target?.role === "owner") {
    throw new ApiError("FORBIDDEN", "Owner tidak dapat keluar dari project miliknya.");
  }
  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, targetUserId)));
}

export async function listInvitesForUser(user: User): Promise<Invite[]> {
  const db = getDb();
  const rows = await db
    .select({ invite: projectInvites, projectName: projects.name })
    .from(projectInvites)
    .innerJoin(projects, eq(projectInvites.projectId, projects.id))
    .where(
      and(
        eq(projectInvites.status, "pending"),
        eq(projectInvites.email, user.email.toLowerCase()),
      ),
    );
  return rows.map((row) => toInvite(row.invite, row.projectName));
}

export async function listProjectInvites(user: User, projectId: string): Promise<Invite[]> {
  const db = getDb();
  await requireMember(db, projectId, user.id);
  const rows = await db
    .select({ invite: projectInvites, projectName: projects.name })
    .from(projectInvites)
    .innerJoin(projects, eq(projectInvites.projectId, projects.id))
    .where(and(eq(projectInvites.projectId, projectId), eq(projectInvites.status, "pending")));
  return rows.map((row) => toInvite(row.invite, row.projectName));
}

export async function createInvite(
  user: User,
  projectId: string,
  input: CreateInviteInput,
): Promise<Invite> {
  const db = getDb();
  await requireOwner(db, projectId, user.id);
  const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  const project = projectRows[0];
  if (!project) throw new ApiError("NOT_FOUND", "Project tidak ditemukan.");

  const email = input.email ? input.email.toLowerCase() : null;
  if (email) {
    const existing = await db
      .select({ userId: users.id })
      .from(users)
      .innerJoin(projectMembers, eq(projectMembers.userId, users.id))
      .where(and(eq(users.email, email), eq(projectMembers.projectId, projectId)))
      .limit(1);
    if (existing.length > 0) {
      throw new ApiError("CONFLICT", "Pengguna tersebut sudah menjadi anggota.");
    }
  }

  const invite: typeof projectInvites.$inferSelect = {
    id: newId("inv"),
    projectId,
    invitedBy: user.id,
    email,
    role: input.role,
    token: newToken(),
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 86_400_000),
    createdAt: new Date(),
  };
  await db.insert(projectInvites).values(invite);
  return toInvite(invite, project.name);
}

async function findInvite(id: string): Promise<typeof projectInvites.$inferSelect> {
  const db = getDb();
  const rows = await db.select().from(projectInvites).where(eq(projectInvites.id, id)).limit(1);
  const row = rows[0];
  if (!row || row.status !== "pending") {
    throw new ApiError("NOT_FOUND", "Undangan tidak ditemukan atau sudah tidak berlaku.");
  }
  return row;
}

async function addMemberIfAbsent(
  projectId: string,
  userId: string,
  role: Role,
): Promise<void> {
  const db = getDb();
  await db
    .insert(projectMembers)
    .values({
      projectId,
      userId,
      role,
      isFavorite: false,
      lastOpenedAt: null,
      joinedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function acceptInvite(user: User, inviteId: string): Promise<{ projectId: string }> {
  const db = getDb();
  const invite = await findInvite(inviteId);
  if (invite.email !== user.email.toLowerCase()) {
    throw new ApiError("FORBIDDEN", "Undangan ini bukan untukmu.");
  }
  await db
    .update(projectInvites)
    .set({ status: "accepted" })
    .where(eq(projectInvites.id, inviteId));
  await addMemberIfAbsent(invite.projectId, user.id, invite.role);
  return { projectId: invite.projectId };
}

export async function declineInvite(user: User, inviteId: string): Promise<void> {
  const db = getDb();
  const invite = await findInvite(inviteId);
  if (invite.email !== user.email.toLowerCase()) {
    throw new ApiError("FORBIDDEN", "Undangan ini bukan untukmu.");
  }
  await db
    .update(projectInvites)
    .set({ status: "declined" })
    .where(eq(projectInvites.id, inviteId));
}

export async function revokeInvite(user: User, inviteId: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(projectInvites)
    .where(eq(projectInvites.id, inviteId))
    .limit(1);
  const invite = rows[0];
  if (!invite) throw new ApiError("NOT_FOUND", "Undangan tidak ditemukan.");
  await requireOwner(db, invite.projectId, user.id);
  await db
    .update(projectInvites)
    .set({ status: "revoked" })
    .where(eq(projectInvites.id, inviteId));
}

export async function joinInvite(user: User, token: string): Promise<{ projectId: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(projectInvites)
    .where(and(eq(projectInvites.token, token), eq(projectInvites.status, "pending")))
    .limit(1);
  const invite = rows[0];
  if (!invite) {
    throw new ApiError("NOT_FOUND", "Tautan undangan tidak valid atau sudah kedaluwarsa.");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await db
      .update(projectInvites)
      .set({ status: "expired" })
      .where(eq(projectInvites.id, invite.id));
    throw new ApiError("NOT_FOUND", "Tautan undangan sudah kedaluwarsa.");
  }
  await db
    .update(projectInvites)
    .set({ status: "accepted" })
    .where(eq(projectInvites.id, invite.id));
  await addMemberIfAbsent(invite.projectId, user.id, invite.role);
  return { projectId: invite.projectId };
}
