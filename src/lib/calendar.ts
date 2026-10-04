import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

export const WEEK_OPTIONS = { weekStartsOn: 1 as const, locale: idLocale };

export function startOfMonthGrid(month: Date): Date {
  return startOfWeek(startOfMonth(month), WEEK_OPTIONS);
}

export function endOfMonthGrid(month: Date): Date {
  return endOfWeek(endOfMonth(month), WEEK_OPTIONS);
}

export function monthMatrix(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonthGrid(month),
    end: endOfMonthGrid(month),
  });
}

export function monthLabel(month: Date): string {
  return format(month, "MMMM yyyy", { locale: idLocale });
}

export function fullDayLabel(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: idLocale });
}

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
