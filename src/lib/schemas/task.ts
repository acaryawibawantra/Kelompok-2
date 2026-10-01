import { z } from "zod";
import { dueDateSchema, idSchema, isoDateTimeSchema } from "./common";

export const prioritySchema = z.enum(["low", "medium", "high"]);
export const taskFilterSchema = z.enum(["all", "active", "done"]);

export const taskSchema = z.object({
  id: idSchema,
  subjectId: idSchema,
  projectId: idSchema,
  title: z.string().min(1).max(200),
  notes: z.string().nullable(),
  isDone: z.boolean(),
  completedAt: isoDateTimeSchema.nullable(),
  completedBy: idSchema.nullable(),
  assigneeId: idSchema.nullable(),
  dueDate: dueDateSchema.nullable(),
  priority: prioritySchema.nullable(),
  isArchived: z.boolean(),
  position: z.number(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Judul task wajib diisi").max(200, "Maksimal 200 karakter"),
  notes: z.string().max(5000, "Catatan maksimal 5000 karakter").nullable().optional(),
  dueDate: dueDateSchema.nullable().optional(),
  priority: prioritySchema.nullable().optional(),
  assigneeId: idSchema.nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().max(5000).nullable().optional(),
  isDone: z.boolean().optional(),
  dueDate: dueDateSchema.nullable().optional(),
  priority: prioritySchema.nullable().optional(),
  assigneeId: idSchema.nullable().optional(),
  subjectId: idSchema.optional(),
  position: z.number().optional(),
  isArchived: z.boolean().optional(),
});

export const taskWithContextSchema = taskSchema.extend({
  projectName: z.string(),
  subjectName: z.string(),
});

export type Priority = z.infer<typeof prioritySchema>;
export type TaskFilter = z.infer<typeof taskFilterSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ArchivedTask = z.infer<typeof taskWithContextSchema>;
export type DueTask = z.infer<typeof taskWithContextSchema>;
