"use client";

import { formatDueDate } from "@/lib/format";
import type { AttendanceSummary } from "@/types";
import { WeeklyChart } from "./weekly-chart";

export function AttendanceDashboard({ summary }: { summary: AttendanceSummary }) {
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

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-title text-2xl text-foreground">Rekap Minggu Ini</h2>
        <p className="text-muted text-sm">
          {formatDueDate(week.start)} – {formatDueDate(week.end)}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <div>
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Streak kehadiran
            </p>
            <p className="font-title text-6xl leading-none text-foreground">
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
            <p className="font-title text-6xl leading-none text-foreground">
              {week.rate}
              <span className="text-muted ml-1 text-3xl">%</span>
            </p>
            <div className="bg-surface-2 mt-3 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand-600 h-full rounded-full transition-[width]"
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
            <p className="text-muted text-xs">
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
    </section>
  );
}
