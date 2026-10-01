import { z } from "zod";
import { colorHexSchema, idSchema, isoDateTimeSchema } from "./common";

export const subjectSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1).max(80),
  color: colorHexSchema.nullable(),
  position: z.number(),
  createdAt: isoDateTimeSchema,
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Nama subject wajib diisi").max(80, "Maksimal 80 karakter"),
  color: colorHexSchema.nullable().optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: colorHexSchema.nullable().optional(),
  position: z.number().optional(),
});

export type Subject = z.infer<typeof subjectSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
