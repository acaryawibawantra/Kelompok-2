"use client";

import Link from "next/link";
import { Clock, Flame } from "lucide-react";
import { GoalRing } from "@/components/streak/goal-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useDueToday, useMe, useStreak } from "@/lib/queries";
import { cn } from "@/lib/utils";

function formatDueLabel(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DashboardSummary() {
  const { data: user } = useMe();
  const streak = useStreak();
  const due = useDueToday();

  const summary = streak.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm text-muted">Halo,</p>
        <p className="font-title text-3xl leading-tight text-foreground">
          {user?.name ?? "Sobat TaskCanvas"}
        </p>
        <p className="mt-0.5 text-xs text-muted">{formatDueLabel()}</p>

        <div className="mt-5 flex items-center gap-5">
          {streak.isLoading || !summary ? (
            <Skeleton className="size-32 rounded-full" />
          ) : (
            <GoalRing value={summary.todayCount} goal={summary.dailyGoal} />
          )}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <Flame className="size-4.5 fill-current" aria-hidden />
              </span>
              <div>
                {streak.isLoading || !summary ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <p className="text-xl font-semibold tabular-nums text-foreground">
                    {summary.current} hari
                  </p>
                )}
                <p className="text-xs text-muted">Streak saat ini</p>
              </div>
            </div>
            <div className="text-xs text-muted">
              {summary?.goalReachedToday
                ? "Target hari ini tercapai. Pertahankan!"
                : `Selesaikan ${Math.max(0, (summary?.dailyGoal ?? 0) - (summary?.todayCount ?? 0))} task lagi untuk mencapai target.`}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-brand-600" aria-hidden />
            Jatuh tempo hari ini
          </h2>
          {due.data ? <span className="text-xs text-muted">{due.data.length} task</span> : null}
        </div>

        <div className="mt-3 space-y-2">
          {due.isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (due.data?.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
              Tidak ada task yang jatuh tempo hari ini.
            </p>
          ) : (
            due.data?.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-canvas/60 px-3 py-2 transition-colors hover:border-brand-300 hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    task.priority === "high"
                      ? "bg-danger"
                      : task.priority === "medium"
                        ? "bg-amber-500"
                        : "bg-brand-400",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {task.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {task.projectName} · {task.subjectName}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
