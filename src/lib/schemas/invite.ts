import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { roleSchema } from "./member";

export const inviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

export const inviteRoleSchema = roleSchema.exclude(["owner"]);

export const inviteSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  projectName: z.string(),
  email: z.email().nullable(),
  role: inviteRoleSchema,
  token: z.string(),
  status: inviteStatusSchema,
  expiresAt: isoDateTimeSchema,
});

export const createInviteSchema = z.object({
  email: z.email("Format email tidak valid").nullable().optional(),
  role: inviteRoleSchema,
});

export const joinInviteSchema = z.object({
  token: z.string().min(1),
});

export type InviteStatus = z.infer<typeof inviteStatusSchema>;
export type Invite = z.infer<typeof inviteSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type JoinInviteInput = z.infer<typeof joinInviteSchema>;
