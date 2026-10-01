import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

export const roleSchema = z.enum(["owner", "editor", "viewer"]);

export const memberSchema = z.object({
  userId: idSchema,
  name: z.string(),
  email: z.email(),
  avatarColor: z.string(),
  role: roleSchema,
  joinedAt: isoDateTimeSchema,
  online: z.boolean().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: roleSchema,
});

export type Role = z.infer<typeof roleSchema>;
export type Member = z.infer<typeof memberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
