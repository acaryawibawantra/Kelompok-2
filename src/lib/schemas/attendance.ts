import { z } from "zod";
import { dueDateSchema, idSchema, isoDateTimeSchema } from "./common";

// present = Hadir, late = Terlambat, excused = Izin, absent = Alpha.
export const attendanceStatusSchema = z.enum(["present", "late", "excused", "absent"]);

// Data URL gambar hasil kompresi kamera klien. Batas ~900 KB teks.
const photoSchema = z
  .string()
  .max(900_000, "Ukuran foto terlalu besar")
  .regex(/^data:image\//, "Format foto tidak valid");

export const attendanceRecordSchema = z.object({
  id: idSchema,
  scheduleId: idSchema.nullable(),
  date: dueDateSchema,
  status: attendanceStatusSchema,
  course: z.string().min(1).max(80),
  room: z.string().max(40).nullable(),
  photo: z.string().nullable(),
  note: z.string().max(280).nullable(),
  checkedInAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});

export const createAttendanceSchema = z
  .object({
    scheduleId: idSchema.nullable().optional(),
    date: dueDateSchema,
    status: attendanceStatusSchema,
    // Jika scheduleId diisi, server mengambil course/room dari jadwal; jika tidak, wajib dikirim.
    course: z.string().trim().min(1).max(80).optional(),
    room: z.string().trim().max(40).nullable().optional(),
    photo: photoSchema.nullable().optional(),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.status === "present" || value.status === "late") && !value.photo) {
      ctx.addIssue({
        code: "custom",
        path: ["photo"],
        message: "Foto bukti wajib untuk status Hadir atau Terlambat.",
      });
    }
    if (!value.scheduleId && !value.course) {
      ctx.addIssue({ code: "custom", path: ["course"], message: "Mata kuliah wajib diisi." });
    }
  });

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema.optional(),
  photo: photoSchema.nullable().optional(),
  note: z.string().trim().max(280).nullable().optional(),
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

export const attendanceShareCardCourseSchema = z.object({
  course: z.string(),
  attended: z.number().int().min(0),
  scheduled: z.number().int().min(0),
});

export const attendanceWeekDaySchema = z.object({
  date: dueDateSchema,
  weekday: z.number().int().min(0).max(6),
  attended: z.number().int().min(0),
  scheduled: z.number().int().min(0),
});

export const attendanceSummarySchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  totalPresent: z.number().int().min(0),
  totalLate: z.number().int().min(0),
  totalAbsent: z.number().int().min(0),
  totalExcused: z.number().int().min(0),
  attendanceRate: z.number().int().min(0).max(100),
  todayAttended: z.number().int().min(0),
  todayScheduled: z.number().int().min(0),
  lastAttendedDate: dueDateSchema.nullable(),
  week: z.object({
    start: dueDateSchema,
    end: dueDateSchema,
    attended: z.number().int().min(0),
    scheduled: z.number().int().min(0),
    rate: z.number().int().min(0).max(100),
    courses: z.array(attendanceShareCardCourseSchema),
    days: z.array(attendanceWeekDaySchema),
  }),
});

export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;
export type AttendanceWeekDay = z.infer<typeof attendanceWeekDaySchema>;
export type AttendanceShareCourse = z.infer<typeof attendanceShareCardCourseSchema>;

// Permintaan membuat link rekap untuk satu minggu (Senin).
export const createAttendanceShareSchema = z.object({
  weekStart: dueDateSchema,
});
export type CreateAttendanceShareInput = z.infer<typeof createAttendanceShareSchema>;

// Hasil pembuatan link: token + path relatif (mis. /r/<token>).
export const attendanceShareSchema = z.object({
  token: z.string(),
  path: z.string(),
});
export type AttendanceShare = z.infer<typeof attendanceShareSchema>;

// Rekap publik yang bisa dilihat siapa saja lewat link.
export const publicRecapSchema = z.object({
  name: z.string(),
  avatarColor: z.string(),
  weekStart: dueDateSchema,
  summary: attendanceSummarySchema,
  records: z.array(attendanceRecordSchema),
});
export type PublicRecap = z.infer<typeof publicRecapSchema>;
