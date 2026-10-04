"use client";

import { useMemo, useRef } from "react";
import {
  addDays,
  addMonths,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
  subMonths,
} from "date-fns";
import { WEEKDAYS, WEEK_OPTIONS, dateKey, monthMatrix } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { Priority, ScheduledTask } from "@/types";

const priorityDot: Record<Priority, string> = {
  high: "bg-danger",
  medium: "bg-amber-500",
  low: "bg-brand-400",
};

const priorityBar: Record<Priority, string> = {
  high: "border-l-danger",
  medium: "border-l-amber-500",
  low: "border-l-brand-400",
};

function dotColor(task: ScheduledTask): string {
  return task.isDone ? "bg-muted/40" : task.priority ? priorityDot[task.priority] : "bg-brand-300";
}

export interface MonthGridProps {
  month: Date;
  selected: Date;
  tasksByDay: Map<string, ScheduledTask[]>;
  onSelect: (date: Date) => void;
}

export function MonthGrid({ month, selected, tasksByDay, onSelect }: MonthGridProps) {
  const weeks = useMemo(() => {
    const days = monthMatrix(month);
    const result: Date[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      result.push(days.slice(index, index + 7));
    }
    return result;
  }, [month]);

  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  function focusDate(date: Date) {
    onSelect(date);
    const key = dateKey(date);
    window.requestAnimationFrame(() => {
      cellRefs.current.get(key)?.focus();
    });
  }

  function handleKeyDown(event: React.KeyboardEvent, date: Date) {
    let next: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = addDays(date, -1);
        break;
      case "ArrowRight":
        next = addDays(date, 1);
        break;
      case "ArrowUp":
        next = addDays(date, -7);
        break;
      case "ArrowDown":
        next = addDays(date, 7);
        break;
      case "Home":
        next = startOfWeek(date, WEEK_OPTIONS);
        break;
      case "End":
        next = endOfWeek(date, WEEK_OPTIONS);
        break;
      case "PageUp":
        next = subMonths(date, 1);
        break;
      case "PageDown":
        next = addMonths(date, 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    focusDate(next);
  }

  return (
    <div role="grid" aria-label="Kalender bulanan" className="select-none">
      <div role="row" className="grid grid-cols-7 gap-1 pb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="text-muted text-center text-[11px] font-semibold tracking-wide uppercase"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const key = dateKey(day);
              const dayTasks = tasksByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const isSelected = isSameDay(day, selected);
              const today = isToday(day);
              const openCount = dayTasks.filter((task) => !task.isDone).length;
              const preview = dayTasks.slice(0, 2);

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  ref={(node) => {
                    if (node) cellRefs.current.set(key, node);
                    else cellRefs.current.delete(key);
                  }}
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  aria-label={`${day.getDate()}${dayTasks.length > 0 ? `, ${dayTasks.length} task` : ""}`}
                  aria-current={today ? "date" : undefined}
                  onClick={() => onSelect(day)}
                  onKeyDown={(event) => handleKeyDown(event, day)}
                  className={cn(
                    "group relative flex min-h-16 flex-col gap-1 rounded-xl border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                    inMonth ? "bg-surface" : "bg-surface/40",
                    isSelected
                      ? "border-brand-500 ring-brand-500/30 ring-2"
                      : "border-border hover:border-brand-300 hover:bg-surface-2/60",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums sm:size-7 sm:text-sm",
                        today
                          ? "bg-brand-600 text-white"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted/60",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {dayTasks.length > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums sm:hidden",
                          openCount > 0 ? "bg-brand-100 text-brand-700" : "bg-surface text-muted",
                        )}
                      >
                        {dayTasks.length}
                      </span>
                    ) : null}
                  </span>

                  {dayTasks.length > 0 ? (
                    <>
                      <span className="flex flex-wrap items-center gap-1 sm:hidden" aria-hidden>
                        {dayTasks.slice(0, 4).map((task) => (
                          <span
                            key={task.id}
                            className={cn("size-1.5 rounded-full", dotColor(task))}
                          />
                        ))}
                        {dayTasks.length > 4 ? (
                          <span className="text-muted text-[9px]">+{dayTasks.length - 4}</span>
                        ) : null}
                      </span>

                      <span className="hidden flex-1 flex-col gap-0.5 sm:flex" aria-hidden>
                        {preview.map((task) => (
                          <span
                            key={task.id}
                            className={cn(
                              "bg-surface-2/80 text-foreground truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] font-medium",
                              task.isDone && "text-muted line-through",
                              task.priority ? priorityBar[task.priority] : "border-l-border",
                            )}
                          >
                            {task.title}
                          </span>
                        ))}
                        {dayTasks.length > preview.length ? (
                          <span className="text-muted px-1 text-[10px]">
                            +{dayTasks.length - preview.length} lagi
                          </span>
                        ) : null}
                      </span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
