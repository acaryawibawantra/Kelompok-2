"use client";

import { useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceSummary } from "@/types";

// Urutan Senin–Minggu, mengikuti minggu pada computeAttendanceSummary.
const DAY_INITIAL = ["S", "S", "R", "K", "J", "S", "M"] as const;

function buildShareText(summary: AttendanceSummary, name: string): string {
  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  return [
    `Presensi kuliah ${name} · ${range}`,
    `Hadir ${summary.week.attended}/${summary.week.scheduled} kelas (${summary.week.rate}%)`,
    `Streak kehadiran ${summary.currentStreak} hari`,
    `Rata-rata kehadiran ${summary.attendanceRate}%`,
    "#TaskCanvas",
  ].join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
  } else {
    context.rect(x, y, width, height);
  }
  context.closePath();
}

function downloadCard(summary: AttendanceSummary, name: string): void {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#0f172a");
  background.addColorStop(1, "#064e3b");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#34d399";
  context.font = "600 40px ui-sans-serif, system-ui, sans-serif";
  context.fillText("PRESENSI MINGGU INI", 80, 150);

  context.fillStyle = "rgba(255,255,255,0.75)";
  context.font = "400 36px ui-sans-serif, system-ui, sans-serif";
  context.fillText(`${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`, 80, 210);

  context.fillStyle = "#ffffff";
  context.font = "700 220px ui-sans-serif, system-ui, sans-serif";
  context.fillText(`${summary.week.rate}%`, 80, 440);

  context.fillStyle = "rgba(255,255,255,0.85)";
  context.font = "500 48px ui-sans-serif, system-ui, sans-serif";
  context.fillText(`Hadir ${summary.week.attended}/${summary.week.scheduled} kelas`, 84, 520);

  // Bar per hari Senin–Minggu.
  const barWidth = 110;
  const gap = 28;
  const baseY = 900;
  const maxBar = 240;
  summary.week.days.forEach((day, index) => {
    const x = 80 + index * (barWidth + gap);
    const ratio = day.scheduled > 0 ? Math.min(1, day.attended / day.scheduled) : 0;
    const barHeight = Math.max(12, Math.round(maxBar * ratio));
    context.fillStyle = "rgba(255,255,255,0.14)";
    roundedRect(context, x, baseY - maxBar, barWidth, maxBar, 20);
    context.fill();
    context.fillStyle = "#34d399";
    roundedRect(context, x, baseY - barHeight, barWidth, barHeight, 20);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.75)";
    context.font = "500 32px ui-sans-serif, system-ui, sans-serif";
    context.fillText(DAY_INITIAL[index], x + barWidth / 2 - 10, baseY + 60);
  });

  context.fillStyle = "#ffffff";
  context.font = "700 56px ui-sans-serif, system-ui, sans-serif";
  context.fillText(`${summary.currentStreak} hari streak kehadiran`, 80, 1100);

  context.fillStyle = "rgba(255,255,255,0.6)";
  context.font = "400 34px ui-sans-serif, system-ui, sans-serif";
  context.fillText(`${name} · TaskCanvas`, 80, 1240);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `presensi-${summary.week.start}.png`;
  link.click();
}

export function ShareCard({ summary, name }: { summary: AttendanceSummary; name: string }) {
  const { toast } = useToast();
  const sharing = useRef(false);

  async function handleShare() {
    if (sharing.current) return;
    sharing.current = true;
    const text = buildShareText(summary, name);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Presensi Kuliah", text });
      } else if (await copyText(text)) {
        toast({ title: "Ringkasan disalin", description: "Tempel untuk membagikan." });
      } else {
        toast({ title: "Gagal membagikan", tone: "error" });
      }
    } catch {
      /* pengguna membatalkan share */
    } finally {
      sharing.current = false;
    }
  }

  const topCourse = summary.week.courses.find((course) => course.scheduled > 0);

  return (
    <section className="overflow-hidden rounded-card border border-border shadow-soft">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 p-6 text-white">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-300 uppercase">
          Presensi Minggu Ini
        </p>
        <p className="mt-1 text-sm text-white/70">
          {formatDueDate(summary.week.start)} – {formatDueDate(summary.week.end)}
        </p>

        <div className="mt-5 flex items-end gap-3">
          <span className="font-title text-7xl leading-none text-white">{summary.week.rate}%</span>
          <span className="pb-2 text-sm text-white/80">
            hadir {summary.week.attended}/{summary.week.scheduled} kelas
          </span>
        </div>

        <div className="mt-6 flex items-end gap-2">
          {summary.week.days.map((day, index) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-16 w-full items-end overflow-hidden rounded-lg bg-white/10">
                <div
                  className={cn(
                    "w-full rounded-lg transition-all",
                    day.scheduled === 0
                      ? "bg-white/5"
                      : day.attended >= day.scheduled
                        ? "bg-emerald-400"
                        : day.attended > 0
                          ? "bg-emerald-500/60"
                          : "bg-white/15",
                  )}
                  style={{
                    height:
                      day.scheduled > 0
                        ? `${Math.max(10, Math.round((day.attended / day.scheduled) * 100))}%`
                        : "10%",
                  }}
                />
              </div>
              <span className="text-[10px] text-white/60">{DAY_INITIAL[index]}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="text-white/90">
            <strong className="font-semibold text-white">{summary.currentStreak}</strong> hari streak
          </span>
          <span className="text-white/90">
            <strong className="font-semibold text-white">{summary.totalPresent}</strong> total hadir
          </span>
          {topCourse ? (
            <span className="text-white/90">
              Terbaik: <strong className="font-semibold text-white">{topCourse.course}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-surface p-3">
        <Button variant="secondary" size="sm" onClick={() => void handleShare()}>
          <Share2 className="size-4" aria-hidden />
          Bagikan
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void copyText(buildShareText(summary, name)).then((ok) =>
              toast(
                ok
                  ? { title: "Ringkasan disalin" }
                  : { title: "Gagal menyalin", tone: "error" },
              ),
            )
          }
        >
          Salin ringkasan
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadCard(summary, name)}>
          <Download className="size-4" aria-hidden />
          Unduh PNG
        </Button>
      </div>
    </section>
  );
}
