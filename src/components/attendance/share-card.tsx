"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { formatDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceSummary, AttendanceWeekDay } from "@/types";

// Senin–Minggu, mengikuti urutan minggu pada computeAttendanceSummary.
const DAY_INITIAL = ["S", "S", "R", "K", "J", "S", "M"] as const;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

type TemplateId = "transparent" | "dark" | "light";
type Orientation = "portrait" | "landscape";

interface Theme {
  label: string;
  background: string | null;
  text: string;
  subtext: string;
  track: string;
  barTop: string;
  barBottom: string;
  accent: string;
}

const THEMES: Record<TemplateId, Theme> = {
  transparent: {
    label: "Transparan",
    background: null,
    text: "#ffffff",
    subtext: "rgba(255, 255, 255, 0.62)",
    track: "rgba(255, 255, 255, 0.16)",
    barTop: "#34d399",
    barBottom: "#059669",
    accent: "#34d399",
  },
  dark: {
    label: "Gelap",
    background: "#0b1220",
    text: "#ffffff",
    subtext: "rgba(255, 255, 255, 0.58)",
    track: "rgba(255, 255, 255, 0.10)",
    barTop: "#34d399",
    barBottom: "#0f766e",
    accent: "#34d399",
  },
  light: {
    label: "Terang",
    background: "#f6f5f2",
    text: "#17161a",
    subtext: "rgba(23, 22, 26, 0.55)",
    track: "rgba(23, 22, 26, 0.08)",
    barTop: "#2dd4bf",
    barBottom: "#0f766e",
    accent: "#0f766e",
  },
};

const TEMPLATE_OPTIONS: Array<{ value: TemplateId; label: string }> = [
  { value: "transparent", label: "Transparan" },
  { value: "dark", label: "Gelap" },
  { value: "light", label: "Terang" },
];

const ORIENTATION_OPTIONS: Array<{ value: Orientation; label: string }> = [
  { value: "portrait", label: "Potret" },
  { value: "landscape", label: "Lanskap" },
];

function buildShareText(summary: AttendanceSummary, name: string): string {
  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  const best = summary.week.courses.find((course) => course.scheduled > 0)?.course;
  return [
    `Presensi kuliah ${name}`,
    range,
    `Hadir ${summary.week.attended}/${summary.week.scheduled} kelas (${summary.week.rate}%)`,
    `Streak ${summary.currentStreak} hari`,
    `Rata-rata kehadiran ${summary.attendanceRate}%`,
    best ? `Mata kuliah terbaik: ${best}` : "",
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

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, r);
  } else {
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }
}

function drawChart(
  context: CanvasRenderingContext2D,
  theme: Theme,
  days: AttendanceWeekDay[],
  region: { x: number; y: number; width: number; height: number },
): void {
  const labelHeight = Math.round(region.height * 0.11);
  const chartHeight = region.height - labelHeight;
  const baseline = region.y + chartHeight;
  const maxValue = Math.max(1, ...days.map((day) => day.scheduled));
  const slot = region.width / days.length;
  const barWidth = Math.min(slot * 0.56, 150);

  // Garis dasar.
  context.fillStyle = theme.track;
  context.fillRect(region.x, baseline, region.width, 3);

  days.forEach((day, index) => {
    const centerX = region.x + slot * index + slot / 2;
    const barX = centerX - barWidth / 2;
    const trackHeight = day.scheduled > 0 ? (day.scheduled / maxValue) * chartHeight : 0;
    const fillHeight = day.attended > 0 ? Math.max(12, (day.attended / maxValue) * chartHeight) : 0;

    if (trackHeight > 0) {
      roundRect(context, barX, baseline - trackHeight, barWidth, trackHeight, barWidth * 0.26);
      context.fillStyle = theme.track;
      context.fill();
    }

    if (fillHeight > 0) {
      const gradient = context.createLinearGradient(0, baseline - fillHeight, 0, baseline);
      gradient.addColorStop(0, theme.barTop);
      gradient.addColorStop(1, theme.barBottom);
      roundRect(context, barX, baseline - fillHeight, barWidth, fillHeight, barWidth * 0.26);
      context.fillStyle = gradient;
      context.fill();

      context.fillStyle = theme.text;
      context.textAlign = "center";
      context.font = `700 ${Math.round(barWidth * 0.36)}px ${FONT}`;
      context.fillText(String(day.attended), centerX, baseline - fillHeight - 14);
    }

    context.fillStyle = theme.subtext;
    context.textAlign = "center";
    context.font = `600 ${Math.round(labelHeight * 0.6)}px ${FONT}`;
    context.fillText(DAY_INITIAL[index], centerX, baseline + labelHeight * 0.82);
  });
}

/**
 * Render kartu presensi dengan grafik mingguan sebagai elemen utama.
 * Mendukung beberapa template (transparan/gelap/terang) dan orientasi
 * (potret 1080x1920, lanskap 1920x1080). Tanpa emoji/ikon dekoratif.
 */
function renderAttendanceCard(
  summary: AttendanceSummary,
  name: string,
  templateId: TemplateId,
  orientation: Orientation,
): HTMLCanvasElement {
  const theme = THEMES[templateId];
  const portrait = orientation === "portrait";
  const width = portrait ? 1080 : 1920;
  const height = portrait ? 1920 : 1080;
  const pad = portrait ? 96 : 88;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");

  context.clearRect(0, 0, width, height);
  if (theme.background) {
    context.fillStyle = theme.background;
    context.fillRect(0, 0, width, height);
  }

  const setLetterSpacing = (value: string) => {
    if ("letterSpacing" in context) {
      (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value;
    }
  };

  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  const bestCourse = summary.week.courses.find((course) => course.scheduled > 0)?.course;
  const secondary = [
    `Streak ${summary.currentStreak} hari`,
    `Total hadir ${summary.totalPresent}`,
    `Rata-rata ${summary.attendanceRate}%`,
  ];

  if (portrait) {
    // Header
    context.textAlign = "left";
    setLetterSpacing("6px");
    context.fillStyle = theme.accent;
    context.font = `700 40px ${FONT}`;
    context.fillText("PRESENSI MINGGU INI", pad, 170);
    setLetterSpacing("0px");
    context.fillStyle = theme.subtext;
    context.font = `500 42px ${FONT}`;
    context.fillText(range, pad, 236);

    // Grafik utama
    drawChart(context, theme, summary.week.days, {
      x: pad,
      y: 360,
      width: width - pad * 2,
      height: 760,
    });

    // Angka utama
    context.textAlign = "left";
    setLetterSpacing("4px");
    context.fillStyle = theme.subtext;
    context.font = `600 38px ${FONT}`;
    context.fillText("KEHADIRAN MINGGU INI", pad, 1320);
    setLetterSpacing("0px");
    context.fillStyle = theme.text;
    context.font = `800 210px ${FONT}`;
    context.fillText(`${summary.week.rate}%`, pad - 8, 1520);

    context.fillStyle = theme.subtext;
    context.font = `500 48px ${FONT}`;
    context.fillText(
      `Hadir ${summary.week.attended} dari ${summary.week.scheduled} kelas`,
      pad,
      1608,
    );

    // Statistik pendukung
    context.font = `500 40px ${FONT}`;
    context.fillStyle = theme.subtext;
    context.fillText(secondary.join("   ·   "), pad, 1720);
    if (bestCourse) {
      context.fillText(`Terbaik: ${bestCourse}`, pad, 1780);
    }

    // Identitas + wordmark
    context.textAlign = "left";
    context.fillStyle = theme.subtext;
    context.font = `500 42px ${FONT}`;
    context.fillText(name, pad, 1870);
    context.textAlign = "right";
    setLetterSpacing("8px");
    context.fillStyle = theme.text;
    context.font = `800 46px ${FONT}`;
    context.fillText("TASKCANVAS", width - pad, 1870);
    setLetterSpacing("0px");
  } else {
    // Panel kiri: identitas + angka utama
    context.textAlign = "left";
    setLetterSpacing("6px");
    context.fillStyle = theme.accent;
    context.font = `700 40px ${FONT}`;
    context.fillText("PRESENSI MINGGU INI", pad, 150);
    setLetterSpacing("0px");
    context.fillStyle = theme.subtext;
    context.font = `500 40px ${FONT}`;
    context.fillText(range, pad, 212);

    setLetterSpacing("4px");
    context.fillStyle = theme.subtext;
    context.font = `600 34px ${FONT}`;
    context.fillText("KEHADIRAN MINGGU INI", pad, 430);
    setLetterSpacing("0px");

    context.fillStyle = theme.text;
    context.font = `800 190px ${FONT}`;
    context.fillText(`${summary.week.rate}%`, pad - 6, 620);

    context.fillStyle = theme.subtext;
    context.font = `500 44px ${FONT}`;
    context.fillText(
      `Hadir ${summary.week.attended} dari ${summary.week.scheduled} kelas`,
      pad,
      700,
    );

    context.font = `500 36px ${FONT}`;
    context.fillText(secondary.join("   ·   "), pad, 790);
    if (bestCourse) {
      context.fillText(`Terbaik: ${bestCourse}`, pad, 848);
    }

    // Identitas + wordmark
    context.textAlign = "left";
    context.fillStyle = theme.subtext;
    context.font = `500 36px ${FONT}`;
    context.fillText(name, pad, 1010);
    context.textAlign = "right";
    setLetterSpacing("8px");
    context.fillStyle = theme.text;
    context.font = `800 40px ${FONT}`;
    context.fillText("TASKCANVAS", width - pad, 1010);
    setLetterSpacing("0px");

    // Panel kanan: grafik utama
    drawChart(context, theme, summary.week.days, {
      x: 900,
      y: 170,
      width: width - 900 - pad,
      height: height - 340,
    });
  }

  return canvas;
}

const CHECKERBOARD = {
  backgroundImage:
    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
  backgroundColor: "#f9fafb",
} as const;

export function ShareCard({ summary, name }: { summary: AttendanceSummary; name: string }) {
  const { toast } = useToast();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [template, setTemplate] = useState<TemplateId>("dark");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const full = renderAttendanceCard(summary, name, template, orientation);
    const portrait = orientation === "portrait";
    canvas.width = portrait ? 300 : 480;
    canvas.height = portrait ? 533 : 270;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(full, 0, 0, canvas.width, canvas.height);
  }, [summary, name, template, orientation]);

  function download() {
    try {
      const canvas = renderAttendanceCard(summary, name, template, orientation);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `presensi-${template}-${orientation}-${summary.week.start}.png`;
      link.click();
    } catch {
      toast({ title: "Gagal membuat gambar", tone: "error" });
    }
  }

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

  const portrait = orientation === "portrait";

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-title text-2xl text-foreground">Kartu Pamer</h2>
            <p className="text-muted text-sm">
              Grafik kehadiran mingguan sebagai elemen utama. Pilih template & orientasi, lalu
              unduh PNG.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <div className="space-y-1.5">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">Template</p>
              <Segmented
                ariaLabel="Template kartu"
                options={TEMPLATE_OPTIONS}
                value={template}
                onChange={setTemplate}
                size="sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">Orientasi</p>
              <Segmented
                ariaLabel="Orientasi kartu"
                options={ORIENTATION_OPTIONS}
                value={orientation}
                onChange={setOrientation}
                size="sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={download}>
              <Download className="size-4" aria-hidden />
              Unduh PNG
            </Button>
            <Button variant="outline" onClick={() => void handleShare()}>
              <Share2 className="size-4" aria-hidden />
              Bagikan
            </Button>
            <Button
              variant="ghost"
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
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-muted text-xs uppercase">Kelas dihadiri</dt>
              <dd className="text-foreground text-xl font-semibold tabular-nums">
                {summary.week.attended}/{summary.week.scheduled}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Kehadiran</dt>
              <dd className="text-foreground text-xl font-semibold tabular-nums">
                {summary.week.rate}%
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Streak</dt>
              <dd className="text-foreground text-xl font-semibold tabular-nums">
                {summary.currentStreak} hari
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Total hadir</dt>
              <dd className="text-foreground text-xl font-semibold tabular-nums">
                {summary.totalPresent}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2 lg:w-[340px]">
          <span className="text-muted self-start text-xs font-semibold tracking-wide uppercase">
            Pratinjau
          </span>
          <div
            className={cn(
              "flex w-full items-center justify-center rounded-2xl border border-border p-3",
              portrait ? "max-w-[280px]" : "",
            )}
            style={template === "transparent" ? CHECKERBOARD : undefined}
          >
            <canvas ref={previewRef} className="h-auto w-full rounded-lg" />
          </div>
          <p className="text-muted text-center text-xs">
            {portrait ? "1080 × 1920 (9:16)" : "1920 × 1080 (16:9)"} · PNG
            {template === "transparent" ? " transparan" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
