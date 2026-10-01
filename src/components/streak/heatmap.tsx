"use client";

import { format, getDay, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { StreakDay } from "@/types";

const LEVEL_CLASS = [
  "bg-surface-2",
  "bg-brand-200 dark:bg-brand-900/70",
  "bg-brand-400",
  "bg-brand-600",
  "bg-brand-800 dark:bg-brand-500",
];

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function Heatmap({ days }: { days: StreakDay[] }) {
  if (days.length === 0) return null;

  const firstWeekday = (getDay(parseISO(days[0]!.date)) + 6) % 7;
  const cells: Array<StreakDay | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];
  const weeks: Array<Array<StreakDay | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  let lastMonth = "";
  const monthLabels = weeks.map((week) => {
    const firstDay = week.find((cell): cell is StreakDay => cell !== null);
    if (!firstDay) return "";
    const month = format(parseISO(firstDay.date), "MMM", { locale: idLocale });
    if (month !== lastMonth) {
      lastMonth = month;
      return month;
    }
    return "";
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block min-w-full">
        <div className="mb-1 flex gap-1 pl-8">
          {monthLabels.map((label, index) => (
            <div key={index} className="w-3.5 text-[10px] text-muted">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex w-7 flex-col gap-1 pr-1 text-[10px] text-muted">
            <span className="h-3.5 leading-3.5">Sen</span>
            <span className="h-3.5" />
            <span className="h-3.5 leading-3.5">Rab</span>
            <span className="h-3.5" />
            <span className="h-3.5 leading-3.5">Jum</span>
            <span className="h-3.5" />
            <span className="h-3.5" />
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((cell, dayIndex) => (
                <div
                  key={dayIndex}
                  title={
                    cell
                      ? `${format(parseISO(cell.date), "d MMM yyyy", { locale: idLocale })} · ${cell.count} task`
                      : undefined
                  }
                  className={cn(
                    "size-3.5 rounded-[3px]",
                    cell ? LEVEL_CLASS[level(cell.count)] : "bg-transparent",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted">
          <span>Sedikit</span>
          {LEVEL_CLASS.map((cls, index) => (
            <span key={index} className={cn("size-3 rounded-[3px]", cls)} />
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  );
}
