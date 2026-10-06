"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarCheck2, CalendarClock, GraduationCap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useUpdateTask } from "@/lib/queries";
import { todayInTimezone } from "@/lib/format";
import { fullDayLabel } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { ClassSchedule, Priority, ScheduledTask } from "@/types";

const priorityColor: Record<Priority, string> = {
  high: "bg-danger",
  medium: "bg-amber-500",
  low: "bg-brand-400",
};

const priorityLabel: Record<Priority, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: ScheduledTask[]): ScheduledTask[] {
  return [...tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    const aPriority = a.priority ? priorityOrder[a.priority] : 3;
    const bPriority = b.priority ? priorityOrder[b.priority] : 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.position - b.position;
  });
}

function ScheduledTaskRow({ task, timezone }: { task: ScheduledTask; timezone: string }) {
  const updateTask = useUpdateTask(task.projectId);
  const { toast } = useToast();
  const today = todayInTimezone(timezone);
  const overdue = !task.isDone && task.dueDate !== null && task.dueDate < today;

  return (
    <li
      className={cn(
        "group border-border bg-surface hover:border-brand-300 hover:bg-surface-2/60 flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        task.isDone && "opacity-70",
      )}
    >
      <div className="mt-0.5">
        <Checkbox
          checked={task.isDone}
          label={`Tandai "${task.title}" ${task.isDone ? "belum selesai" : "selesai"}`}
          onCheckedChange={(checked) =>
            updateTask.mutate(
              { id: task.id, input: { isDone: checked } },
              { onError: () => toast({ title: "Gagal memperbarui task", tone: "error" }) },
            )
          }
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-foreground truncate text-sm font-medium",
            task.isDone && "text-muted line-through",
          )}
        >
          {task.title}
        </p>
        <p className="text-muted mt-0.5 truncate text-xs">
          {task.projectName} · {task.subjectName}
        </p>
        {task.priority ? (
          <span className="bg-surface-2 text-muted mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
            <span
              className={cn("size-1.5 rounded-full", priorityColor[task.priority])}
              aria-hidden
            />
            {priorityLabel[task.priority]}
          </span>
        ) : null}
        {overdue ? (
          <span className="bg-danger-soft mt-1.5 ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
            Terlambat
          </span>
        ) : null}
      </div>

      <Link
        href={`/projects/${task.projectId}`}
        aria-label={`Buka project ${task.projectName}`}
        className="text-muted hover:bg-surface-2 hover:text-foreground grid size-8 shrink-0 place-items-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </li>
  );
}

export interface DayAgendaProps {
  date: Date;
  tasks: ScheduledTask[];
  sessions: ClassSchedule[];
  timezone: string;
  isLoading: boolean;
  isToday: boolean;
}

export function DayAgenda({ date, tasks, sessions, timezone, isLoading, isToday }: DayAgendaProps) {
  const done = tasks.filter((task) => task.isDone).length;

  return (
    <section
      aria-label={`Agenda ${fullDayLabel(date)}`}
      className="rounded-card border-border bg-surface shadow-soft flex flex-col border p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-brand-600 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase">
            {isToday ? (
              <CalendarCheck2 className="size-3.5" aria-hidden />
            ) : (
              <CalendarClock className="size-3.5" aria-hidden />
            )}
            {isToday ? "Hari ini" : "Agenda"}
          </p>
          <h2 className="font-title text-foreground mt-1 text-2xl leading-tight">
            {fullDayLabel(date)}
          </h2>
        </div>
        {tasks.length > 0 ? (
          <span className="bg-surface-2 text-muted shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
            {done}/{tasks.length}
          </span>
        ) : null}
      </div>

      {sessions.length > 0 ? (
        <div className="border-border mt-4 border-t pt-4">
          <p className="text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase">
            <GraduationCap className="size-3.5" aria-hidden />
            Kelas ({sessions.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="border-border bg-surface flex items-center gap-3 rounded-xl border-l-2 border-l-emerald-500 px-3 py-2"
              >
                <span className="w-24 shrink-0 text-sm font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                  {session.start}–{session.end}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{session.course}</p>
                  {session.room ? (
                    <p className="text-muted truncate text-xs">Ruang {session.room}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="border-border flex h-full min-h-40 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center">
            <CalendarClock className="text-muted/60 size-7" aria-hidden />
            <p className="text-foreground mt-2 text-sm font-medium">Tidak ada task</p>
            <p className="text-muted text-xs">
              {sessions.length > 0
                ? `Tidak ada task yang jatuh tempo, tapi ada ${sessions.length} kelas hari ini.`
                : "Tidak ada task yang jatuh tempo pada hari ini."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortTasks(tasks).map((task) => (
              <ScheduledTaskRow key={task.id} task={task} timezone={timezone} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
