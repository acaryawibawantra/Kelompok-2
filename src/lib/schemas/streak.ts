import { z } from "zod";
import { dueDateSchema } from "./common";

export const streakDaySchema = z.object({
  date: dueDateSchema,
  count: z.number().int().min(0),
});

export const streakSummarySchema = z.object({
  current: z.number().int().min(0),
  longest: z.number().int().min(0),
  todayCount: z.number().int().min(0),
  dailyGoal: z.number().int().min(1).max(20),
  goalReachedToday: z.boolean(),
  activeToday: z.boolean(),
  lastActiveDate: dueDateSchema.nullable(),
  days: z.array(streakDaySchema),
  totalCompleted: z.number().int().min(0),
});

export type StreakDay = z.infer<typeof streakDaySchema>;
export type StreakSummary = z.infer<typeof streakSummarySchema>;
