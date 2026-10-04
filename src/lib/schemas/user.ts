import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

export const titleFontSchema = z.enum(["handwritten", "modern", "serif"]);
export const themeModeSchema = z.enum(["light", "dark", "system"]);

export const userSettingsSchema = z.object({
  titleFont: titleFontSchema.default("modern"),
  theme: themeModeSchema.default("system"),
  dailyGoal: z.number().int().min(1).max(20).default(3),
});

export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
  email: z.email(),
  avatarColor: z.string(),
  timezone: z.string().min(1).default("Asia/Jakarta"),
  settings: userSettingsSchema,
  createdAt: isoDateTimeSchema,
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter"),
  email: z.email("Format email tidak valid").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

export const loginSchema = z.object({
  email: z.email("Format email tidak valid").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi"),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80).optional(),
  timezone: z.string().min(1).optional(),
  settings: userSettingsSchema.partial().optional(),
});

export type TitleFont = z.infer<typeof titleFontSchema>;
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type User = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
