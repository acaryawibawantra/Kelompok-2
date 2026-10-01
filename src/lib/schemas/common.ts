import { z } from "zod";

export const idSchema = z.string().min(1);

export const isoDateTimeSchema = z.iso.datetime();

export const dueDateSchema = z.iso.date();

export const colorHexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex, contoh #5b5ce2");

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
