"use client";

import { cn } from "@/lib/utils";
import type { AttendanceWeekDay } from "@/types";

// Senin–Minggu, mengikuti urutan minggu pada computeAttendanceSummary.
const DAY_INITIAL = ["S", "S", "R", "K", "J", "S", "M"] as const;

/**
 * Grafik batang kehadiran mingguan (DOM). Tinggi batang relatif terhadap
 * jumlah kelas terjadwal terbanyak pada minggu itu; bagian terisi = kehadiran.
 */
export function WeeklyChart({ days, className }: { days: AttendanceWeekDay[]; className?: string }) {
  const max = Math.max(1, ...days.map((day) => day.scheduled));

  return (
    <div className={cn("flex items-end gap-2", className)}>
      {days.map((day, index) => {
        const trackPercent = day.scheduled > 0 ? Math.round((day.scheduled / max) * 100) : 0;
        const fillPercent =
          day.scheduled > 0 ? Math.round((day.attended / day.scheduled) * 100) : 0;
        const full = day.scheduled > 0 && day.attended >= day.scheduled;

        return (
          <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="bg-surface-2 relative w-full rounded-lg"
                style={{ height: `${trackPercent}%` }}
              >
                {day.attended > 0 ? (
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 rounded-lg",
                      full ? "bg-brand-600" : "bg-brand-400",
                    )}
                    style={{ height: `${fillPercent}%` }}
                  />
                ) : null}
                {day.attended > 0 ? (
                  <span className="text-muted absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums">
                    {day.attended}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="text-muted text-[11px] font-medium">{DAY_INITIAL[index]}</span>
          </div>
        );
      })}
    </div>
  );
}
