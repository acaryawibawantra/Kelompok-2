import { z } from "zod";
import { colorHexSchema, idSchema, isoDateTimeSchema } from "./common";

export const projectScopeSchema = z.enum(["all", "favorites", "recent"]);
export const projectStatsSchema = z.object({
  total: z.number().int().min(0),
  done: z.number().int().min(0),
});

export const projectSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
  emoji: z.string().nullable(),
  color: colorHexSchema,
  description: z.string().nullable(),
  ownerId: idSchema,
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  lastOpenedAt: isoDateTimeSchema.nullable(),
  memberCount: z.number().int().min(0),
  taskStats: projectStatsSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama project wajib diisi")
    .max(80, "Nama project maksimal 80 karakter"),
  emoji: z.string().max(8).nullable().optional(),
  color: colorHexSchema,
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().max(8).nullable().optional(),
  color: colorHexSchema.optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const favoriteInputSchema = z.object({
  value: z.boolean(),
});

export type ProjectScope = z.infer<typeof projectScopeSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
