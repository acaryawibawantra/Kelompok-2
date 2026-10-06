"use client";

import { Download, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceSummary } from "@/types";

// Senin–Minggu, mengikuti urutan minggu pada computeAttendanceSummary.
const DAY_INITIAL = ["S", "S", "R", "K", "J", "S", "M"] as const;

const FONT_STACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

interface StoryStat {
  emoji: string;
  label: string;
  value: string;
  valueFont?: number;
}

function storyStats(summary: AttendanceSummary): StoryStat[] {
  const bestCourse = summary.week.courses.find((course) => course.scheduled > 0)?.course;
  const stats: StoryStat[] = [
    {
      emoji: "🎓",
      label: "Kelas Dihadiri",
      value: `${summary.week.attended}/${summary.week.scheduled}`,
    },
    { emoji: "🔥", label: "Streak Kehadiran", value: `${summary.currentStreak} hari` },
    { emoji: "📈", label: "Persentase Hadir", value: `${summary.week.rate}%` },
    { emoji: "✅", label: "Total Hadir", value: `${summary.totalPresent}` },
  ];
  if (bestCourse) {
    const trimmed = bestCourse.length > 28 ? `${bestCourse.slice(0, 27)}…` : bestCourse;
    stats.push({ emoji: "🏆", label: "Mata Kuliah Terbaik", value: trimmed, valueFont: 68 });
  }
  return stats;
}

function buildShareText(summary: AttendanceSummary, name: string): string {
  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  const best = summary.week.courses.find((course) => course.scheduled > 0)?.course;
  return [
    `🎓 Presensi kuliah ${name}`,
    `🗓️ ${range}`,
    `✅ Hadir ${summary.week.attended}/${summary.week.scheduled} kelas (${summary.week.rate}%)`,
    `🔥 Streak ${summary.currentStreak} hari`,
    `📈 Rata-rata kehadiran ${summary.attendanceRate}%`,
    best ? `🏆 Terbaik: ${best}` : "",
    "#TaskCanvas",
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Render kartu Story 9:16 dengan latar TRANSPARAN (bergaya Strava):
 * label + angka besar bertumpuk, emoji per statistik, ikon, dan wordmark.
 * Teks putih diberi bayangan tipis agar tetap terbaca di latar terang.
 */
function renderStoryCard(summary: AttendanceSummary, name: string): HTMLCanvasElement {
  const width = 1080;
  const height = 1920;
  const centerX = width / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");

  context.clearRect(0, 0, width, height); // latar transparan
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 2;

  // Header: label + rentang minggu.
  context.fillStyle = "rgba(255, 255, 255, 0.85)";
  context.font = `700 40px ${FONT_STACK}`;
  context.fillText("PRESENSI KULIAH 🎓", centerX, 170);
  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.font = `500 40px ${FONT_STACK}`;
  context.fillText(
    `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`,
    centerX,
    232,
  );

  // Blok statistik bertumpuk.
  const stats = storyStats(summary);
  let y = 440;
  context.shadowBlur = 12;
  for (const stat of stats) {
    context.fillStyle = "rgba(255, 255, 255, 0.78)";
    context.font = `600 44px ${FONT_STACK}`;
    context.fillText(`${stat.emoji} ${stat.label.toUpperCase()}`, centerX, y);

    context.fillStyle = "#ffffff";
    context.font = `800 ${stat.valueFont ?? 124}px ${FONT_STACK}`;
    context.fillText(stat.value, centerX, y + (stat.valueFont ? 92 : 136));
    y += stat.valueFont ? 210 : 250;
  }

  // Ikon besar sebagai penanda, mirip siluet sepatu Strava.
  context.shadowBlur = 16;
  context.font = `150px ${FONT_STACK}`;
  context.fillText("🏛️", centerX, 1580);

  // Wordmark di bawah.
  context.shadowBlur = 10;
  context.fillStyle = "#ffffff";
  context.font = `800 64px ${FONT_STACK}`;
  const wordmark = "TASKCANVAS";
  const spacing = 10;
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
  }
  context.fillText(wordmark, centerX, 1760);
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  }

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  // Nama kecil di paling bawah.
  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.font = `500 34px ${FONT_STACK}`;
  context.fillText(name, centerX, 1830);

  return canvas;
}

function downloadStoryCard(summary: AttendanceSummary, name: string): void {
  const canvas = renderStoryCard(summary, name);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `presensi-story-${summary.week.start}.png`;
  link.click();
}

export function ShareCard({ summary, name }: { summary: AttendanceSummary; name: string }) {
  const { toast } = useToast();

  async function handleShare() {
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
    }
  }

  const bestCourse = summary.week.courses.find((course) => course.scheduled > 0);
  const stats = [
    { emoji: "🎓", label: "Kelas dihadiri", value: `${summary.week.attended}/${summary.week.scheduled}` },
    { emoji: "🔥", label: "Streak", value: `${summary.currentStreak} hari` },
    { emoji: "📈", label: "Persentase", value: `${summary.week.rate}%` },
    { emoji: "✅", label: "Total hadir", value: `${summary.totalPresent}` },
  ];

  return (
    <section className="overflow-hidden rounded-card border border-border shadow-soft">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900 p-6 text-white">
        <div className="flex items-center gap-2 text-emerald-300">
          <Sparkles className="size-4" aria-hidden />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">Presensi Minggu Ini</p>
        </div>
        <p className="mt-1 text-sm text-white/70">
          {formatDueDate(summary.week.start)} – {formatDueDate(summary.week.end)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                {stat.emoji} {stat.label}
              </p>
              <p className="font-title mt-0.5 text-4xl leading-none text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {bestCourse ? (
          <p className="mt-5 text-sm text-white/85">
            🏆 Mata kuliah terbaik:{" "}
            <strong className="font-semibold text-white">{bestCourse.course}</strong>
          </p>
        ) : null}

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
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface p-3">
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
        <Button variant="outline" size="sm" onClick={() => downloadStoryCard(summary, name)}>
          <Download className="size-4" aria-hidden />
          Unduh PNG Story
        </Button>
        <span className="text-muted ml-auto text-xs">PNG transparan · 9:16</span>
      </div>
    </section>
  );
}
