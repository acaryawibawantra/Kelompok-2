"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ATTENDANCE_STATUS_META } from "@/components/attendance/status";
import {
  useAttendance,
  useAttendanceSummary,
  useMe,
  useSchedules,
  useStreak,
} from "@/lib/queries";
import { formatDueDate, todayInTimezone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus, ClassSchedule } from "@/types";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

function toMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Menit lokal perangkat. Jadwal kuliah disimpan sebagai jam lokal tanpa zona. */
function useNowMinutes(): number | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return now ? now.getHours() * 60 + now.getMinutes() : null;
}

function classStatus(
  schedule: ClassSchedule,
  nowMinutes: number,
): { label: string; live: boolean } | null {
  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);
  if (nowMinutes >= start && nowMinutes < end) return { label: "Sedang berlangsung", live: true };
  if (nowMinutes < start) {
    const left = start - nowMinutes;
    return { label: left < 60 ? `Mulai dalam ${left} menit` : `Mulai dalam ${Math.round(left / 60)} jam`, live: false };
  }
  return null;
}

function RecordChip({ status }: { status: AttendanceStatus | null }) {
  if (!status) {
    return (
      <span className="bg-surface-2 text-muted shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
        Belum
      </span>
    );
  }
  const meta = ATTENDANCE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        meta.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border-border bg-surface shadow-soft border p-3.5">
      <dt className="text-muted text-[11px] leading-tight">{label}</dt>
      <dd className="text-foreground mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function TodayHub() {
  const { data: user } = useMe();
  const timezone = user?.timezone;
  const today = todayInTimezone(timezone);
  const weekday = useMemo(() => new Date(`${today}T12:00:00Z`).getUTCDay(), [today]);

  const schedulesQuery = useSchedules();
  const summaryQuery = useAttendanceSummary();
  const streakQuery = useStreak();
  const attendanceQuery = useAttendance({ from: today, to: today });
  const nowMinutes = useNowMinutes();

  const todayClasses = useMemo(
    () =>
      (schedulesQuery.data ?? [])
        .filter((schedule) => schedule.weekday === weekday)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [schedulesQuery.data, weekday],
  );

  const recordBySchedule = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of attendanceQuery.data ?? []) {
      if (record.scheduleId) map.set(record.scheduleId, record);
    }
    return map;
  }, [attendanceQuery.data]);

  const nextClass = useMemo(() => {
    if (todayClasses.length === 0) return null;
    if (nowMinutes === null) return todayClasses[0] ?? null;
    return (
      todayClasses.find((schedule) => toMinutes(schedule.end) > nowMinutes) ??
      null
    );
  }, [todayClasses, nowMinutes]);

  const status = nextClass && nowMinutes !== null ? classStatus(nextClass, nowMinutes) : null;
  const loading = schedulesQuery.isLoading || summaryQuery.isLoading || streakQuery.isLoading;

  return (
    <section aria-labelledby="hari-ini-heading" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="hari-ini-heading"
          className="text-foreground flex items-center gap-2 text-sm font-semibold"
        >
          <CalendarClock className="text-brand-600 size-4" aria-hidden />
          Hari Ini
        </h2>
        <p className="text-muted text-xs">
          {DAY_NAMES[weekday]}, {formatDueDate(today, timezone)}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3">
        {summaryQuery.isLoading ? (
          <Skeleton className="h-[70px] rounded-card" />
        ) : (
          <StatTile label="Kehadiran minggu ini" value={`${summaryQuery.data?.week.rate ?? 0}%`} />
        )}
        {streakQuery.isLoading ? (
          <Skeleton className="h-[70px] rounded-card" />
        ) : (
          <StatTile label="Streak" value={`${streakQuery.data?.current ?? 0} hari`} />
        )}
        {streakQuery.isLoading ? (
          <Skeleton className="h-[70px] rounded-card" />
        ) : (
          <StatTile label="Task selesai hari ini" value={`${streakQuery.data?.todayCount ?? 0}`} />
        )}
      </dl>

      <div className="mt-3 grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="rounded-card border-border bg-surface shadow-soft border p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
              Kelas berikutnya
            </p>
            {status ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  status.live
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "bg-surface-2 text-muted",
                )}
              >
                {status.live ? (
                  <span className="bg-brand-600 size-1.5 rounded-full motion-safe:animate-pulse" aria-hidden />
                ) : (
                  <Clock className="size-3" aria-hidden />
                )}
                {status.label}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-32 rounded-xl" />
            </div>
          ) : nextClass ? (
            <>
              <p className="text-foreground mt-2 truncate text-lg font-medium">{nextClass.course}</p>
              <p className="text-muted mt-0.5 text-sm tabular-nums">
                {nextClass.start}–{nextClass.end}
                {nextClass.room ? ` · Ruang ${nextClass.room}` : ""}
              </p>
              <Link
                href="/presensi"
                className={cn(buttonClass("primary", "sm"), "mt-3 w-fit")}
              >
                Catat presensi
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </>
          ) : (
            <EmptyState
              className="mt-3 border-0 bg-transparent px-2 py-6"
              icon={<CalendarDays className="size-5" aria-hidden />}
              title={todayClasses.length === 0 ? "Belum ada kelas hari ini" : "Kelas hari ini selesai"}
              description={
                todayClasses.length === 0
                  ? "Atur jadwal kuliah supaya pengingat presensi muncul di sini."
                  : "Semua kelas hari ini sudah lewat. Absen yang terlewat bisa dicatat dari halaman presensi."
              }
              action={
                <Link
                  href={todayClasses.length === 0 ? "/jadwal" : "/presensi"}
                  className={buttonClass("outline", "sm")}
                >
                  {todayClasses.length === 0 ? "Atur jadwal" : "Catat presensi"}
                </Link>
              }
            />
          )}
        </div>

        {loading ? (
          <div className="rounded-card border-border bg-surface shadow-soft border p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-10 w-full rounded-xl" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
          </div>
        ) : todayClasses.length > 0 ? (
          <div className="rounded-card border-border bg-surface shadow-soft border p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-foreground text-sm font-semibold">Presensi hari ini</h3>
              <Link href="/presensi" className="text-brand-700 dark:text-brand-300 text-xs font-medium">
                Lihat semua
              </Link>
            </div>
            <ul className="mt-3 space-y-1.5">
              {todayClasses.map((schedule) => (
                <li key={schedule.id}>
                  <Link
                    href="/presensi"
                    className="border-border hover:bg-surface-2 focus-visible:ring-brand-500 flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-muted shrink-0 text-xs font-semibold tabular-nums">
                      {schedule.start}
                    </span>
                    <span className="text-foreground min-w-0 flex-1 truncate text-sm">
                      {schedule.course}
                    </span>
                    <RecordChip status={recordBySchedule.get(schedule.id)?.status ?? null} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
