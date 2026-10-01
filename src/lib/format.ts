import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

export function relativeTime(iso: string | null): string {
  if (!iso) return "Belum pernah dibuka";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: idLocale });
  } catch {
    return "";
  }
}

export function formatDueDate(dueDate: string | null, timezone = "Asia/Jakarta"): string {
  if (!dueDate) return "";
  try {
    return formatInTimeZone(parseISO(`${dueDate}T00:00:00Z`), timezone, "d MMM", { locale: idLocale });
  } catch {
    return dueDate;
  }
}

export function formatFullDate(dueDate: string, timezone = "Asia/Jakarta"): string {
  try {
    return formatInTimeZone(
      parseISO(`${dueDate}T00:00:00Z`),
      timezone,
      "EEEE, d MMMM yyyy",
      { locale: idLocale },
    );
  } catch {
    return dueDate;
  }
}

export function todayInTimezone(timezone = "Asia/Jakarta"): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

export function isOverdue(dueDate: string | null, timezone = "Asia/Jakarta"): boolean {
  if (!dueDate) return false;
  return dueDate < todayInTimezone(timezone);
}

export function isToday(dueDate: string | null, timezone = "Asia/Jakarta"): boolean {
  if (!dueDate) return false;
  return dueDate === todayInTimezone(timezone);
}

export function formatDateTime(iso: string, timezone = "Asia/Jakarta"): string {
  try {
    return formatInTimeZone(parseISO(iso), timezone, "d MMM yyyy, HH:mm", { locale: idLocale });
  } catch {
    return "";
  }
}

export function formatMonthDay(date: Date, pattern = "d MMM"): string {
  return format(date, pattern, { locale: idLocale });
}
