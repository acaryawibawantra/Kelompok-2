import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

// Hari: 0 = Minggu .. 6 = Sabtu (mengikuti Date.getDay()).
export const weekdaySchema = z
  .number()
  .int("Hari tidak valid")
  .min(0, "Hari tidak valid")
  .max(6, "Hari tidak valid");

// Jam dalam format 24 jam "HH:MM", contoh "07:30".
export const classTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:MM, contoh 07:30");

export const classScheduleSchema = z.object({
  id: idSchema,
  weekday: weekdaySchema,
  start: classTimeSchema,
  end: classTimeSchema,
  course: z.string().min(1).max(80),
  room: z.string().max(40).nullable(),
  createdAt: isoDateTimeSchema,
});

export const createClassScheduleSchema = z
  .object({
    weekday: weekdaySchema,
    start: classTimeSchema,
    end: classTimeSchema,
    course: z
      .string()
      .trim()
      .min(1, "Nama mata kuliah wajib diisi")
      .max(80, "Maksimal 80 karakter"),
    room: z.string().trim().max(40, "Maksimal 40 karakter").nullable().optional(),
  })
  .refine((value) => value.start < value.end, {
    message: "Jam selesai harus setelah jam mulai",
    path: ["end"],
  });

export const updateClassScheduleSchema = z
  .object({
    weekday: weekdaySchema.optional(),
    start: classTimeSchema.optional(),
    end: classTimeSchema.optional(),
    course: z.string().trim().min(1).max(80).optional(),
    room: z.string().trim().max(40).nullable().optional(),
  })
  .refine(
    (value) =>
      value.start === undefined || value.end === undefined || value.start < value.end,
    { message: "Jam selesai harus setelah jam mulai", path: ["end"] },
  );

export type ClassSchedule = z.infer<typeof classScheduleSchema>;
export type CreateClassScheduleInput = z.infer<typeof createClassScheduleSchema>;
export type UpdateClassScheduleInput = z.infer<typeof updateClassScheduleSchema>;

// Impor massal hasil OCR: satu permintaan berisi banyak jadwal sekaligus.
export const bulkCreateClassSchedulesSchema = z.object({
  items: z
    .array(createClassScheduleSchema)
    .min(1, "Minimal satu jadwal")
    .max(50, "Maksimal 50 jadwal sekali impor"),
});
export type BulkCreateClassSchedulesInput = z.infer<typeof bulkCreateClassSchedulesSchema>;
