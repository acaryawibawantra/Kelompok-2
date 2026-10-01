"use client";

import { Flame, Target, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/layout/page-header";
import { GoalRing } from "@/components/streak/goal-ring";
import { Heatmap } from "@/components/streak/heatmap";
import { WeekStrip } from "@/components/streak/week-strip";
import { MilestoneBadges } from "@/components/streak/milestone-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreak } from "@/lib/queries";

export default function StreakPage() {
  const { data, isLoading, isError, refetch } = useStreak();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Gamifikasi"
        title="Streak"
        description="Jaga konsistensimu. Hari dihitung berdasarkan zona waktumu."
      />

      {isLoading ? (
        <div className="mt-8 space-y-5">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      ) : isError || !data ? (
        <div className="mt-8">
          <EmptyState
            icon={<Flame className="size-6" aria-hidden />}
            title="Gagal memuat streak"
            description="Coba muat ulang halaman ini."
            action={
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Muat ulang
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="flex items-center gap-6 rounded-card border border-border bg-surface p-6 shadow-soft">
              <motion.span
                className="grid size-20 shrink-0 place-items-center rounded-3xl bg-amber-100 text-amber-500 dark:bg-amber-950/40"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className="size-11 fill-current" aria-hidden />
              </motion.span>
              <div>
                <p className="font-title text-6xl leading-none text-foreground">
                  {data.current}
                  <span className="ml-2 text-2xl text-muted">hari</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {data.activeToday
                    ? "Kamu sudah aktif hari ini. Mantap!"
                    : "Belum ada aktivitas hari ini. Yuk selesaikan satu task."}
                </p>
              </div>
            </section>

            <section className="flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-surface p-5 shadow-soft">
              <GoalRing value={data.todayCount} goal={data.dailyGoal} size={120} />
              <p className="text-center text-sm text-muted">
                {data.goalReachedToday
                  ? "Target harian tercapai!"
                  : `${Math.max(0, data.dailyGoal - data.todayCount)} task lagi menuju target`}
              </p>
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                <Trophy className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{data.longest}</p>
                <p className="text-xs text-muted">Streak terpanjang</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Target className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {data.totalCompleted}
                </p>
                <p className="text-xs text-muted">Total task selesai</p>
              </div>
            </div>
          </div>

          <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
            <h2 className="mb-4 font-title text-2xl text-foreground">Aktivitas 12 minggu</h2>
            <Heatmap days={data.days} />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
              <h2 className="mb-4 font-title text-2xl text-foreground">7 hari terakhir</h2>
              <WeekStrip days={data.days} />
            </section>

            <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
              <h2 className="mb-4 font-title text-2xl text-foreground">Milestone</h2>
              <MilestoneBadges longest={data.longest} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
