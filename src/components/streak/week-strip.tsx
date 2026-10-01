"use client";

import { Check, Circle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { StreakDay } from "@/types";

const WEEKDAY = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function WeekStrip({ days }: { days: StreakDay[] }) {
  const lastSeven = days.slice(-7);

  return (
    <div className="flex items-center justify-between gap-2">
      {lastSeven.map((day) => {
        const date = parseISO(day.date);
        const active = day.count >= 1;
        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] text-muted">{WEEKDAY[date.getDay()]}</span>
            <span
              title={`${day.count} task`}
              className={cn(
                "grid size-8 place-items-center rounded-full",
                active
                  ? "bg-emerald-500 text-white"
                  : "border border-dashed border-border text-muted",
              )}
            >
              {active ? (
                <Check className="size-4" strokeWidth={3} aria-hidden />
              ) : (
                <Circle className="size-3" aria-hidden />
              )}
            </span>
            <span className="text-[10px] text-muted">{format(date, "d/M", { locale: idLocale })}</span>
          </div>
        );
      })}
    </div>
  );
}
