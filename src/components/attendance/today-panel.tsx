"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, Flame, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendance, useAttendanceSummary, useMe } from "@/lib/queries";
import { todayInTimezone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceRecord, ClassSchedule } from "@/types";
import { ATTENDANCE_STATUS_META } from "./status";
import { CheckInModal } from "./check-in-modal";

export function AttendanceTodayPanel({ schedules }: { schedules: ClassSchedule[] }) {
  const { data: user } = useMe();
  const timezone = user?.timezone ?? "Asia/Jakarta";
  const today = todayInTimezone(timezone);
  const todayWeekday = new Date(`${today}T00:00:00Z`).getUTCDay();

  const todayClasses = useMemo(
    () =>
      schedules
        .filter((schedule) => schedule.weekday === todayWeekday)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [schedules, todayWeekday],
  );

  const attendanceQuery = useAttendance({ from: today, to: today });
  const summaryQuery = useAttendanceSummary();
  const [active, setActive] = useState<ClassSchedule | null>(null);

  const recordBySchedule = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of attendanceQuery.data ?? []) {
      if (record.scheduleId) map.set(record.scheduleId, record);
    }
    return map;
  }, [attendanceQuery.data]);

  if (todayClasses.length === 0) return null;

  const done = todayClasses.filter((schedule) => recordBySchedule.has(schedule.id)).length;
  const streak = summaryQuery.data?.currentStreak ?? 0;
  const activeRecord = active ? (recordBySchedule.get(active.id) ?? null) : null;

  return (
    <section className="rounded-card border border-emerald-200 bg-emerald-50/50 p-4 shadow-soft dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid size-9 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CalendarCheck2 className="size-5" aria-hidden />
        </span>
        <div className="mr-auto">
          <h2 className="font-title text-xl leading-none text-foreground">Kelas Hari Ini</h2>
          <p className="text-muted text-xs">
            {done}/{todayClasses.length} sesi sudah diabsen
          </p>
        </div>
        {streak > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Flame className="size-3.5 fill-current" aria-hidden />
            {streak} hari streak
          </span>
        ) : null}
      </div>

      <ul className="space-y-2">
        {todayClasses.map((schedule) => {
          const record = recordBySchedule.get(schedule.id);
          const meta = record ? ATTENDANCE_STATUS_META[record.status] : null;
          return (
            <li
              key={schedule.id}
              className="border-border bg-surface flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:gap-4 sm:px-4"
            >
              <span className="text-brand-600 dark:text-brand-300 w-24 shrink-0 text-sm font-semibold tabular-nums sm:w-28">
                {schedule.start}–{schedule.end}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{schedule.course}</p>
                {schedule.room ? (
                  <p className="text-muted truncate text-xs">Ruang {schedule.room}</p>
                ) : null}
              </div>
              {meta ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    meta.badge,
                  )}
                >
                  <CheckCircle2 className="size-3" aria-hidden />
                  {meta.label}
                </span>
              ) : (
                <span className="text-muted hidden shrink-0 text-xs sm:inline">Belum diabsen</span>
              )}
              <Button
                variant={record ? "ghost" : "primary"}
                size="sm"
                onClick={() => setActive(schedule)}
                className="shrink-0"
              >
                {record ? "Ubah" : "Absen"}
              </Button>
            </li>
          );
        })}
      </ul>

      <p className="text-muted mt-3 flex items-center gap-1.5 text-xs">
        <GraduationCap className="size-3.5" aria-hidden />
        Kehadiran tersimpan otomatis per sesi mingguan.
      </p>

      <CheckInModal
        open={active !== null}
        schedule={active}
        date={today}
        record={activeRecord}
        onClose={() => setActive(null)}
      />
    </section>
  );
}
