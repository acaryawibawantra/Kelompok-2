import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { StreakDay, StreakSummary } from "@/lib/schemas/streak";

export interface StreakInput {
  activity: Array<{ date: string; count: number }>;
  timezone: string;
  dailyGoal: number;
  now: Date;
  windowDays?: number;
}

const DAY_FORMAT = "yyyy-MM-dd";

function toCalendarDate(day: string): Date {
  return parseISO(`${day}T00:00:00Z`);
}

function toDayString(date: Date): string {
  return format(date, DAY_FORMAT);
}

function isActive(count: number | undefined): boolean {
  return (count ?? 0) >= 1;
}

export function localDay(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, DAY_FORMAT);
}

export function computeStreak({
  activity,
  timezone,
  dailyGoal,
  now,
  windowDays = 84,
}: StreakInput): StreakSummary {
  const counts = new Map<string, number>();
  for (const entry of activity) {
    counts.set(entry.date, Math.max(0, entry.count));
  }

  const today = localDay(now, timezone);
  const yesterday = toDayString(subDays(toCalendarDate(today), 1));

  let cursor: string | null = null;
  if (isActive(counts.get(today))) {
    cursor = today;
  } else if (isActive(counts.get(yesterday))) {
    cursor = yesterday;
  }

  let current = 0;
  while (cursor !== null && isActive(counts.get(cursor))) {
    current += 1;
    cursor = toDayString(subDays(toCalendarDate(cursor), 1));
  }

  const activeDays = [...counts.entries()]
    .filter(([, count]) => count >= 1)
    .map(([date]) => date)
    .sort();

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of activeDays) {
    if (previous !== null && differenceInCalendarDays(toCalendarDate(day), toCalendarDate(previous)) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = day;
  }

  const todayCount = counts.get(today) ?? 0;
  const activeToday = todayCount >= 1;
  const lastActiveDate = activeDays.length > 0 ? activeDays[activeDays.length - 1]! : null;

  const days: StreakDay[] = [];
  const todayDate = toCalendarDate(today);
  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = toDayString(addDays(todayDate, -offset));
    days.push({ date, count: counts.get(date) ?? 0 });
  }

  const totalCompleted = activity.reduce((sum, entry) => sum + Math.max(0, entry.count), 0);

  return {
    current,
    longest,
    todayCount,
    dailyGoal,
    goalReachedToday: todayCount >= dailyGoal,
    activeToday,
    lastActiveDate,
    days,
    totalCompleted,
  };
}
