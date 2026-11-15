"use client";

import { useMemo } from "react";
import { Download, Flame, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeAttendanceBadges, type AttendanceBadgeId } from "@/lib/attendance-badges";
import { buildAttendanceCsv } from "@/lib/attendance-csv";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, AttendanceSummary } from "@/types";
import { WeeklyChart } from "./weekly-chart";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

const BADGE_ICON: Record<AttendanceBadgeId, typeof Flame> = {
  "perfect-week": Sparkles,
  "streak-7": Flame,
  "sessions-25": Trophy,
  "tanpa-alpa": ShieldCheck,
};

// Ambang warna: >=85 aman, 70–84 waspada, <70 berisiko.
function courseTone(rate: number): { bar: string; text: string; label: string } {
  if (rate >= 85) {
    return { bar: "bg-success", text: "text-emerald-700 dark:text-emerald-300", label: "Aman" };
  }
  if (rate >= 70) {
    return { bar: "bg-warning", text: "text-amber-700 dark:text-amber-300", label: "Waspada" };
  }
  return { bar: "bg-danger", text: "text-rose-700 dark:text-rose-300", label: "Berisiko" };
}

export function AttendanceDashboard({
  summary,
  records = [],
}: {
  summary: AttendanceSummary;
  records?: AttendanceRecord[];
}) {
  const week = summary.week;
  const bestCourse = week.courses.find((course) => course.scheduled > 0)?.course;

  const metrics = [
    { label: "Kelas dihadiri", value: `${week.attended}/${week.scheduled}` },
    { label: "Total hadir", value: `${summary.totalPresent}` },
    { label: "Terlambat", value: `${summary.totalLate}` },
    { label: "Izin", value: `${summary.totalExcused}` },
    { label: "Alpha", value: `${summary.totalAbsent}` },
    { label: "Rata-rata kehadiran", value: `${summary.attendanceRate}%` },
  ];

  const badges = useMemo(() => computeAttendanceBadges(summary), [summary]);

  // Rekap per mata kuliah dari catatan di memori, terburuk lebih dulu.
  const courseStats = useMemo(() => {
    const map = new Map<string, { course: string; attended: number; total: number }>();
    for (const record of records) {
      const entry = map.get(record.course) ?? { course: record.course, attended: 0, total: 0 };
      entry.total += 1;
      if (record.status === "present" || record.status === "late") entry.attended += 1;
      map.set(record.course, entry);
    }
    return [...map.values()]
      .map((entry) => ({ ...entry, rate: Math.round((entry.attended / entry.total) * 100) }))
      .sort((a, b) => a.rate - b.rate || a.course.localeCompare(b.course));
  }, [records]);

  const bestDay = useMemo(() => {
    let best: { attended: number; weekday: number } | null = null;
    for (const day of week.days) {
      if (day.attended > 0 && (!best || day.attended > best.attended)) {
        best = { attended: day.attended, weekday: day.weekday };
      }
    }
    return best;
  }, [week.days]);

  const totalSessions = summary.totalPresent + summary.totalLate;

  function exportCsv() {
    const csv = buildAttendanceCsv(records, week);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `presensi-${week.start}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-card border-border bg-surface shadow-soft border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-title text-foreground text-2xl">Rekap Minggu Ini</h2>
          <p className="text-muted mt-0.5 text-sm">
            {formatDueDate(week.start)} – {formatDueDate(week.end)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={records.length === 0}
          aria-label="Ekspor presensi minggu ini ke CSV"
        >
          <Download className="size-4" aria-hidden />
          Ekspor CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {badges.length === 0 ? (
          <p className="text-muted text-xs">
            Belum ada lencana. Hadiri kelasmu untuk membuka yang pertama.
          </p>
        ) : (
          badges.map((badge) => {
            const Icon = BADGE_ICON[badge.id];
            return (
              <Badge key={badge.id} tone="brand" className="gap-1.5 py-1">
                <Icon className="size-3.5" aria-hidden />
                <span title={badge.description}>{badge.label}</span>
              </Badge>
            );
          })
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <div>
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Streak kehadiran
            </p>
            <p className="font-title text-foreground text-6xl leading-none tabular-nums">
              {summary.currentStreak}
              <span className="text-muted ml-2 text-2xl">hari</span>
            </p>
            <p className="text-muted mt-1 text-xs">
              {summary.currentStreak > 0
                ? "Pertahankan konsistensimu."
                : "Absen kelas untuk memulai streak."}
            </p>
          </div>

          <div>
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Kehadiran minggu ini
            </p>
            <p className="font-title text-foreground text-6xl leading-none tabular-nums">
              {week.rate}
              <span className="text-muted ml-1 text-3xl">%</span>
            </p>
            <div className="bg-surface-2 mt-3 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand-600 h-full rounded-full transition-[width] duration-150 ease-out"
                style={{ width: `${week.rate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Kehadiran per hari
            </p>
            <p className="text-muted text-xs tabular-nums">
              {week.attended} dari {week.scheduled} kelas
            </p>
          </div>
          <WeeklyChart days={week.days} className="mt-6 h-48" />
        </div>
      </div>

      {bestCourse ? (
        <p className="text-muted mt-5 text-sm">
          Mata kuliah terbaik minggu ini:{" "}
          <span className="text-foreground font-medium">{bestCourse}</span>
        </p>
      ) : null}

      <dl className="border-border mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="text-muted text-xs">{metric.label}</dt>
            <dd className="text-foreground mt-0.5 text-2xl font-semibold tabular-nums">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      {courseStats.length > 0 ? (
        <div className="border-border mt-6 border-t pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-foreground text-sm font-semibold">Kehadiran per mata kuliah</h3>
            <p className="text-muted text-xs">Terburuk lebih dulu</p>
          </div>
          <ul className="mt-3 space-y-3">
            {courseStats.map((course) => {
              const tone = courseTone(course.rate);
              return (
                <li key={course.course} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-foreground min-w-0 truncate text-sm">{course.course}</p>
                    <p className="text-muted shrink-0 text-xs tabular-nums">
                      <span className={cn("font-semibold", tone.text)}>{course.attended}</span>/
                      {course.total} · {course.rate}%
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={course.rate}
                    aria-label={`Kehadiran ${course.course}`}
                    className="bg-surface-2 mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-150 ease-out",
                        tone.bar,
                      )}
                      style={{ width: `${course.rate}%` }}
                    />
                  </div>
                  <p className={cn("mt-1 text-[11px] font-medium", tone.text)}>{tone.label}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="border-border mt-6 border-t pt-5">
        <h3 className="text-foreground text-sm font-semibold">Rekor pribadi</h3>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-muted text-[11px] leading-tight">Hari terbaik minggu ini</dt>
            <dd className="text-foreground mt-0.5 text-xl font-semibold tabular-nums">
              {bestDay ? `${bestDay.attended} sesi` : "–"}
            </dd>
            <p className="text-muted text-[11px]">
              {bestDay ? DAY_NAMES[bestDay.weekday] : "Belum ada sesi"}
            </p>
          </div>
          <div>
            <dt className="text-muted text-[11px] leading-tight">Streak terpanjang</dt>
            <dd className="text-foreground mt-0.5 text-xl font-semibold tabular-nums">
              {summary.longestStreak} hari
            </dd>
            <p className="text-muted text-[11px]">Sejak catatan pertama</p>
          </div>
          <div>
            <dt className="text-muted text-[11px] leading-tight">Total sesi</dt>
            <dd className="text-foreground mt-0.5 text-xl font-semibold tabular-nums">
              {totalSessions}
            </dd>
            <p className="text-muted text-[11px]">Hadir + terlambat</p>
          </div>
        </dl>
      </div>
    </section>
  );
}
