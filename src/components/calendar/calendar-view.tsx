"use client";

import { useMemo, useState } from "react";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthGrid } from "./month-grid";
import { DayAgenda } from "./day-agenda";
import { useMe, useScheduledTasks, useSchedules } from "@/lib/queries";
import { dateKey, monthLabel, monthMatrix } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { ClassSchedule, ScheduledTask } from "@/types";

const selectClass =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:border-brand-400";

export function CalendarView() {
  const { data: user } = useMe();
  const timezone = user?.timezone ?? "Asia/Jakarta";
  const { data, isLoading, isError, refetch } = useScheduledTasks();
  const schedulesQuery = useSchedules();
  const schedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [projectFilter, setProjectFilter] = useState("all");
  const [hideDone, setHideDone] = useState(false);

  const scheduled = useMemo(
    () =>
      (data ?? []).filter(
        (task): task is ScheduledTask & { dueDate: string } => task.dueDate !== null,
      ),
    [data],
  );

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of scheduled) map.set(task.projectId, task.projectName);
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, [scheduled]);

  const filtered = useMemo(
    () =>
      scheduled.filter(
        (task) =>
          (projectFilter === "all" || task.projectId === projectFilter) &&
          (!hideDone || !task.isDone),
      ),
    [scheduled, projectFilter, hideDone],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, ScheduledTask[]>();
    for (const task of filtered) {
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    return map;
  }, [filtered]);

  // Sesi jadwal kuliah mingguan: sama setiap minggu, dipetakan ke tanggal grid bulan.
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ClassSchedule[]>();
    for (const date of monthMatrix(viewMonth)) {
      const daySessions = schedules
        .filter((schedule) => schedule.weekday === date.getDay())
        .sort((a, b) => a.start.localeCompare(b.start));
      if (daySessions.length > 0) map.set(dateKey(date), daySessions);
    }
    return map;
  }, [schedules, viewMonth]);

  const selectedKey = dateKey(selected);
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];
  const selectedSessions = sessionsByDay.get(selectedKey) ?? [];

  const monthPrefix = dateKey(startOfMonth(viewMonth)).slice(0, 7);
  const monthTasks = filtered.filter((task) => task.dueDate.startsWith(monthPrefix));
  const monthDone = monthTasks.filter((task) => task.isDone).length;
  const todayKey = dateKey(new Date());
  const monthOverdue = monthTasks.filter((task) => !task.isDone && task.dueDate < todayKey).length;
  const monthSessions = [...sessionsByDay.entries()]
    .filter(([key]) => key.startsWith(monthPrefix))
    .reduce((sum, [, list]) => sum + list.length, 0);
  const combinedLoading = isLoading || schedulesQuery.isLoading;

  function goToToday() {
    const now = new Date();
    setViewMonth(startOfMonth(now));
    setSelected(now);
  }

  function shiftMonth(delta: number) {
    const next = delta > 0 ? addMonths(viewMonth, 1) : subMonths(viewMonth, 1);
    setViewMonth(next);
    setSelected((current) => addMonths(current, delta));
  }

  function handleSelect(date: Date) {
    setSelected(date);
    if (
      date.getMonth() !== viewMonth.getMonth() ||
      date.getFullYear() !== viewMonth.getFullYear()
    ) {
      setViewMonth(startOfMonth(date));
    }
  }

  const filtersActive = projectFilter !== "all" || hideDone;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Jadwal"
        title="Calendar"
        description="Lihat semua task dengan tenggat dalam satu kalender. Klik tanggal untuk melihat agenda."
        actions={
          <Button variant="secondary" onClick={goToToday}>
            <CalendarDays className="size-4" aria-hidden />
            Hari ini
          </Button>
        }
      />

      {isError ? (
        <div className="mt-8">
          <EmptyState
            icon={<CalendarDays className="size-6" aria-hidden />}
            title="Gagal memuat kalender"
            description="Terjadi kesalahan saat mengambil jadwal task."
            action={
              <Button variant="secondary" onClick={() => void refetch()}>
                <RotateCcw className="size-4" aria-hidden />
                Coba lagi
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section
            aria-label={`Kalender ${monthLabel(viewMonth)}`}
            className="rounded-card border-border bg-surface shadow-soft border p-3 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Bulan sebelumnya"
                  onClick={() => shiftMonth(-1)}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <h2 className="font-title text-foreground min-w-40 text-center text-2xl leading-none capitalize">
                  {monthLabel(viewMonth)}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Bulan berikutnya"
                  onClick={() => shiftMonth(1)}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="calendar-project-filter">
                  Filter project
                </label>
                <span className="relative">
                  <Filter
                    className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <select
                    id="calendar-project-filter"
                    value={projectFilter}
                    onChange={(event) => setProjectFilter(event.target.value)}
                    className={cn(selectClass, "max-w-[11rem] pl-8")}
                  >
                    <option value="all">Semua project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={hideDone}
                  onClick={() => setHideDone((value) => !value)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
                    hideDone
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-200"
                      : "border-border bg-surface text-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "relative h-4 w-7 rounded-full transition-colors",
                      hideDone ? "bg-brand-500" : "bg-border",
                    )}
                    aria-hidden
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-3 rounded-full bg-white transition-all",
                        hideDone ? "left-3.5" : "left-0.5",
                      )}
                    />
                  </span>
                  Sembunyikan selesai
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl sm:h-24" />
                  ))}
                </div>
              </div>
            ) : (
              <MonthGrid
                month={viewMonth}
                selected={selected}
                tasksByDay={tasksByDay}
                sessionsByDay={sessionsByDay}
                onSelect={handleSelect}
              />
            )}

            <div className="border-border text-muted mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-danger size-2 rounded-full" aria-hidden />
                  Prioritas tinggi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" aria-hidden />
                  Sedang
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-brand-400 size-2 rounded-full" aria-hidden />
                  Rendah
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-muted/40 size-2 rounded-full" aria-hidden />
                  Selesai
                </span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span>
                  <strong className="text-foreground font-semibold">{monthTasks.length}</strong>{" "}
                  task
                </span>
                {monthSessions > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-300">
                    <strong className="font-semibold">{monthSessions}</strong> kelas
                  </span>
                ) : null}
                <span>
                  <strong className="text-foreground font-semibold">{monthDone}</strong> selesai
                </span>
                {monthOverdue > 0 ? (
                  <span className="text-rose-600 dark:text-rose-300">
                    <strong className="font-semibold">{monthOverdue}</strong> terlambat
                  </span>
                ) : null}
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProjectFilter("all");
                      setHideDone(false);
                    }}
                    className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 underline-offset-2 hover:underline"
                  >
                    <RotateCcw className="size-3" aria-hidden />
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <DayAgenda
              date={selected}
              tasks={selectedTasks}
              sessions={selectedSessions}
              timezone={timezone}
              isLoading={combinedLoading}
              isToday={selectedKey === todayKey}
            />
            <p className="text-muted mt-3 flex items-center gap-2 px-1 text-xs">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              Gunakan tombol panah untuk berpindah hari, PgUp/PgDn untuk berpindah bulan.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
