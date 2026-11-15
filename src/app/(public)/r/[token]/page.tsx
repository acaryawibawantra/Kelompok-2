import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flame } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { getPublicRecap } from "@/server/services/attendance-service";
import { ATTENDANCE_STATUS_META } from "@/components/attendance/status";
import type { PublicRecap } from "@/lib/schemas/attendance";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  try {
    const recap = await getPublicRecap(token);
    return {
      title: `Rekap presensi ${recap.name}`,
      description: `Kehadiran mingguan ${recap.name}: ${recap.summary.week.attended}/${recap.summary.week.scheduled} sesi (${recap.summary.week.rate}%).`,
    };
  } catch {
    return { title: "Rekap presensi" };
  }
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function rateTone(rate: number): string {
  if (rate >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function badgesFor(recap: PublicRecap): string[] {
  const { summary, records } = recap;
  const badges: string[] = [];
  const { attended, scheduled } = summary.week;
  if (summary.totalAbsent === 0 && attended > 0) badges.push("Tanpa Alpha");
  if (scheduled >= 3 && summary.totalAbsent === 0) badges.push("Minggu Sempurna");
  if (summary.currentStreak >= 7) badges.push(`Streak ${summary.currentStreak} hari`);
  if (summary.totalPresent + summary.totalLate >= 25) badges.push("25+ sesi");
  if (records.some((record) => record.status === "present")) badges.push("Hadir terbukti");
  return badges.slice(0, 3);
}

export default async function PublicRecapPage({ params }: Props) {
  const { token } = await params;

  let recap: PublicRecap;
  try {
    recap = await getPublicRecap(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { summary } = recap;
  const week = summary.week;
  const initials = recap.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const statuses: Array<{ label: string; value: number; meta: string }> = [
    { label: ATTENDANCE_STATUS_META.present.label, value: summary.totalPresent, meta: ATTENDANCE_STATUS_META.present.badge },
    { label: ATTENDANCE_STATUS_META.late.label, value: summary.totalLate, meta: ATTENDANCE_STATUS_META.late.badge },
    { label: ATTENDANCE_STATUS_META.excused.label, value: summary.totalExcused, meta: ATTENDANCE_STATUS_META.excused.badge },
    { label: ATTENDANCE_STATUS_META.absent.label, value: summary.totalAbsent, meta: ATTENDANCE_STATUS_META.absent.badge },
  ];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <main className="w-full max-w-md">
        <article className="rounded-card border border-border bg-surface p-6 shadow-card">
          <header className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: recap.avatarColor }}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-[-0.01em] text-foreground">
                {recap.name}
              </h1>
              <p className="text-xs text-muted">Rekap minggu {formatWeekRange(week.start)}</p>
            </div>
          </header>

          <div className="mt-6 flex items-center gap-5">
            <div
              role="img"
              aria-label={`Tingkat kehadiran minggu ini ${week.rate} persen`}
              className="relative grid size-28 shrink-0 place-items-center"
            >
              <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="var(--color-brand-500)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(week.rate / 100) * 276.5} 276.5`}
                />
              </svg>
              <span className={`absolute text-2xl font-semibold tabular-nums ${rateTone(week.rate)}`}>
                {week.rate}%
              </span>
            </div>
            <dl className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sesi minggu ini</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {week.attended}/{week.scheduled}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Total sesi hadir</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {summary.totalPresent + summary.totalLate}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="inline-flex items-center gap-1 text-muted">
                  <Flame className="size-3.5 text-streak" aria-hidden />
                  Streak kelas
                </dt>
                <dd className="font-medium tabular-nums text-foreground">{summary.currentStreak} hari</dd>
              </div>
            </dl>
          </div>

          {badgesFor(recap).length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Lencana capaian">
              {badgesFor(recap).map((badge) => (
                <li
                  key={badge}
                  className="rounded-pill bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                >
                  {badge}
                </li>
              ))}
            </ul>
          ) : null}

          <section aria-label="Kehadiran per hari" className="mt-6">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              Per hari
            </h2>
            <ul className="mt-2.5 flex gap-1.5">
              {week.days.map((day) => {
                const done = day.attended >= day.scheduled && day.scheduled > 0;
                const partial = day.attended > 0 && day.attended < day.scheduled;
                return (
                  <li
                    key={day.date}
                    title={`${day.date}: ${day.attended}/${day.scheduled} sesi`}
                    className="flex-1 text-center"
                  >
                    <span
                      className={`block h-9 rounded-lg border ${
                        done
                          ? "border-transparent bg-success text-white"
                          : partial
                            ? "border-transparent bg-warning/90 text-white"
                            : day.scheduled > 0
                              ? "border-border bg-surface-2 text-muted"
                              : "border-dashed border-border bg-transparent text-muted/50"
                      } grid place-items-center text-[10px] font-semibold tabular-nums`}
                    >
                      {day.scheduled > 0 ? `${day.attended}/${day.scheduled}` : "–"}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted">
                      {new Intl.DateTimeFormat("id-ID", { weekday: "narrow" }).format(
                        new Date(`${day.date}T00:00:00`),
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {week.courses.length > 0 ? (
            <section aria-label="Kehadiran per mata kuliah" className="mt-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                Per mata kuliah
              </h2>
              <ul className="mt-2.5 space-y-2.5">
                {week.courses.map((course) => {
                  const pct = course.scheduled > 0 ? Math.round((course.attended / course.scheduled) * 100) : 0;
                  return (
                    <li key={course.course}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-foreground">{course.course}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {course.attended}/{course.scheduled}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Kehadiran ${course.course}`}
                        className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-2"
                      >
                        <div
                          className={`h-full rounded-pill ${pct >= 85 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-danger"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section aria-label="Total status kehadiran" className="mt-6">
            <ul className="grid grid-cols-4 gap-2 text-center">
              {statuses.map(({ label, value, meta }) => (
                <li key={label} className="rounded-xl bg-surface-2 px-1 py-2">
                  <span className="block text-base font-semibold tabular-nums text-foreground">{value}</span>
                  <span className={`mt-1 inline-block rounded-pill px-1.5 py-0.5 text-[10px] ${meta}`}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <p className="mt-4 text-center text-xs text-muted">
          Dibagikan lewat{" "}
          <Link href="/" className="font-medium text-brand-600 hover:underline">
            Semangat Brow
          </Link>{" "}
          — catat presensi kuliahmu juga.
        </p>
      </main>
    </div>
  );
}
