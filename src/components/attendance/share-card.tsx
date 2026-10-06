"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { formatDueDate } from "@/lib/format";
import type { AttendanceSummary, AttendanceWeekDay } from "@/types";

// Senin–Minggu, mengikuti urutan minggu pada computeAttendanceSummary.
const DAY_INITIAL = ["S", "S", "R", "K", "J", "S", "M"] as const;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

type Orientation = "portrait" | "landscape";
type Layout = "chart" | "stack";
type TemplateId = "chart-white" | "chart-black" | "stack-white" | "stack-black";

interface Theme {
  /** Transparan: tidak ada latar yang digambar. */
  background: null;
  text: string;
  subtext: string;
  track: string;
  barTop: string;
  barBottom: string;
  accent: string;
}

const WHITE_TEXT: Theme = {
  background: null,
  text: "#ffffff",
  subtext: "rgba(255, 255, 255, 0.62)",
  track: "rgba(255, 255, 255, 0.18)",
  barTop: "#34d399",
  barBottom: "#059669",
  accent: "#34d399",
};

const BLACK_TEXT: Theme = {
  background: null,
  text: "#17161a",
  subtext: "rgba(23, 22, 26, 0.6)",
  track: "rgba(23, 22, 26, 0.12)",
  barTop: "#10b981",
  barBottom: "#047857",
  accent: "#047857",
};

interface TemplateDef {
  label: string;
  layout: Layout;
  theme: Theme;
}

const TEMPLATES: Record<TemplateId, TemplateDef> = {
  "chart-white": { label: "Grafik Putih", layout: "chart", theme: WHITE_TEXT },
  "chart-black": { label: "Grafik Hitam", layout: "chart", theme: BLACK_TEXT },
  "stack-white": { label: "Angka Putih", layout: "stack", theme: WHITE_TEXT },
  "stack-black": { label: "Angka Hitam", layout: "stack", theme: BLACK_TEXT },
};

const TEMPLATE_OPTIONS = (Object.keys(TEMPLATES) as TemplateId[]).map((value) => ({
  value,
  label: TEMPLATES[value].label,
}));

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

function setSpacing(context: CanvasRenderingContext2D, value: string): void {
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value;
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

interface Dims {
  width: number;
  height: number;
  pad: number;
  portrait: boolean;
  centerX: number;
}

function drawChartLayout(
  context: CanvasRenderingContext2D,
  theme: Theme,
  summary: AttendanceSummary,
  name: string,
  dims: Dims,
): void {
  const { width, height, pad, portrait } = dims;
  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  const bestCourse = summary.week.courses.find((course) => course.scheduled > 0)?.course;
  const secondary = [
    `Streak ${summary.currentStreak} hari`,
    `Total hadir ${summary.totalPresent}`,
    `Rata-rata ${summary.attendanceRate}%`,
  ];

  if (portrait) {
    context.textAlign = "left";
    setSpacing(context, "6px");
    context.fillStyle = theme.accent;
    context.font = `700 40px ${FONT}`;
    context.fillText("PRESENSI MINGGU INI", pad, 170);
    setSpacing(context, "0px");
    context.fillStyle = theme.subtext;
    context.font = `500 42px ${FONT}`;
    context.fillText(range, pad, 236);

    drawChart(context, theme, summary.week.days, {
      x: pad,
      y: 360,
      width: width - pad * 2,
      height: 760,
    });

    context.textAlign = "left";
    setSpacing(context, "4px");
    context.fillStyle = theme.subtext;
    context.font = `600 38px ${FONT}`;
    context.fillText("KEHADIRAN MINGGU INI", pad, 1320);
    setSpacing(context, "0px");
    context.fillStyle = theme.text;
    context.font = `800 210px ${FONT}`;
    context.fillText(`${summary.week.rate}%`, pad - 8, 1520);

    context.fillStyle = theme.subtext;
    context.font = `500 48px ${FONT}`;
    context.fillText(`Hadir ${summary.week.attended} dari ${summary.week.scheduled} kelas`, pad, 1608);

    context.font = `500 40px ${FONT}`;
    context.fillText(secondary.join("   ·   "), pad, 1720);
    if (bestCourse) context.fillText(`Terbaik: ${bestCourse}`, pad, 1780);

    context.textAlign = "left";
    context.fillStyle = theme.subtext;
    context.font = `500 42px ${FONT}`;
    context.fillText(name, pad, 1870);
    context.textAlign = "right";
    setSpacing(context, "8px");
    context.fillStyle = theme.text;
    context.font = `800 46px ${FONT}`;
    context.fillText("TASKCANVAS", width - pad, 1870);
    setSpacing(context, "0px");
    return;
  }

  context.textAlign = "left";
  setSpacing(context, "6px");
  context.fillStyle = theme.accent;
  context.font = `700 40px ${FONT}`;
  context.fillText("PRESENSI MINGGU INI", pad, 150);
  setSpacing(context, "0px");
  context.fillStyle = theme.subtext;
  context.font = `500 40px ${FONT}`;
  context.fillText(range, pad, 212);

  setSpacing(context, "4px");
  context.fillStyle = theme.subtext;
  context.font = `600 34px ${FONT}`;
  context.fillText("KEHADIRAN MINGGU INI", pad, 430);
  setSpacing(context, "0px");

  context.fillStyle = theme.text;
  context.font = `800 190px ${FONT}`;
  context.fillText(`${summary.week.rate}%`, pad - 6, 620);

  context.fillStyle = theme.subtext;
  context.font = `500 44px ${FONT}`;
  context.fillText(`Hadir ${summary.week.attended} dari ${summary.week.scheduled} kelas`, pad, 700);

  context.font = `500 36px ${FONT}`;
  context.fillText(secondary.join("   ·   "), pad, 790);
  if (bestCourse) context.fillText(`Terbaik: ${bestCourse}`, pad, 848);

  context.textAlign = "left";
  context.fillStyle = theme.subtext;
  context.font = `500 36px ${FONT}`;
  context.fillText(name, pad, 1010);
  context.textAlign = "right";
  setSpacing(context, "8px");
  context.fillStyle = theme.text;
  context.font = `800 40px ${FONT}`;
  context.fillText("TASKCANVAS", width - pad, 1010);
  setSpacing(context, "0px");

  drawChart(context, theme, summary.week.days, {
    x: 900,
    y: 170,
    width: width - 900 - pad,
    height: height - 340,
  });
}

function drawStackLayout(
  context: CanvasRenderingContext2D,
  theme: Theme,
  summary: AttendanceSummary,
  name: string,
  dims: Dims,
): void {
  const { width, pad, portrait, centerX } = dims;
  const range = `${formatDueDate(summary.week.start)} – ${formatDueDate(summary.week.end)}`;
  const stats = [
    { label: "KELAS DIHADIRI", value: `${summary.week.attended}/${summary.week.scheduled}` },
    { label: "STREAK KEHADIRAN", value: `${summary.currentStreak} hari` },
    { label: "KEHADIRAN MINGGU INI", value: `${summary.week.rate}%` },
    { label: "TOTAL HADIR", value: `${summary.totalPresent}` },
  ];

  context.textAlign = "center";
  setSpacing(context, "6px");
  context.fillStyle = theme.accent;
  context.font = `700 40px ${FONT}`;
  context.fillText("PRESENSI MINGGU INI", centerX, portrait ? 210 : 150);
  setSpacing(context, "0px");
  context.fillStyle = theme.subtext;
  context.font = `500 40px ${FONT}`;
  context.fillText(range, centerX, portrait ? 268 : 210);

  if (portrait) {
    let y = 560;
    for (const stat of stats) {
      setSpacing(context, "5px");
      context.fillStyle = theme.subtext;
      context.font = `700 44px ${FONT}`;
      context.fillText(stat.label, centerX, y);
      setSpacing(context, "0px");
      context.fillStyle = theme.text;
      context.font = `800 150px ${FONT}`;
      context.fillText(stat.value, centerX, y + 156);
      y += 292;
    }

    context.fillStyle = theme.subtext;
    context.font = `500 38px ${FONT}`;
    context.fillText(name, centerX, 1800);
    setSpacing(context, "10px");
    context.fillStyle = theme.text;
    context.font = `800 54px ${FONT}`;
    context.fillText("TASKCANVAS", centerX, 1872);
    setSpacing(context, "0px");
    return;
  }

  const columnWidth = (width - pad * 2) / stats.length;
  stats.forEach((stat, index) => {
    const columnX = pad + columnWidth * (index + 0.5);
    setSpacing(context, "5px");
    context.fillStyle = theme.subtext;
    context.font = `700 40px ${FONT}`;
    context.fillText(stat.label, columnX, 500);
    setSpacing(context, "0px");
    context.fillStyle = theme.text;
    context.font = `800 130px ${FONT}`;
    context.fillText(stat.value, columnX, 690);
  });

  context.fillStyle = theme.subtext;
  context.font = `500 34px ${FONT}`;
  context.fillText(name, centerX, 920);
  setSpacing(context, "10px");
  context.fillStyle = theme.text;
  context.font = `800 54px ${FONT}`;
  context.fillText("TASKCANVAS", centerX, 1000);
  setSpacing(context, "0px");
}

/**
 * Render kartu pamer dengan data presensi asli. Beberapa template
 * (grafik/angka × warna) dan orientasi potret 1080x1920 / lanskap 1920x1080.
 * Tanpa emoji/ikon dekoratif.
 */
function renderAttendanceCard(
  summary: AttendanceSummary,
  name: string,
  templateId: TemplateId,
  orientation: Orientation,
): HTMLCanvasElement {
  const template = TEMPLATES[templateId];
  const theme = template.theme;
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

  const dims: Dims = { width, height, pad, portrait, centerX: width / 2 };
  if (template.layout === "chart") {
    drawChartLayout(context, theme, summary, name, dims);
  } else {
    drawStackLayout(context, theme, summary, name, dims);
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
  const [template, setTemplate] = useState<TemplateId>("chart-white");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const portrait = orientation === "portrait";
  const transparent = TEMPLATES[template].theme.background === null;

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const full = renderAttendanceCard(summary, name, template, orientation);
    canvas.width = portrait ? 300 : 480;
    canvas.height = portrait ? 533 : 270;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(full, 0, 0, canvas.width, canvas.height);
  }, [summary, name, template, orientation, portrait]);

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

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-title text-2xl text-foreground">Template Pamer</h2>
            <p className="text-muted text-sm">
              Beberapa template siap unduh berisi data presensimu. Pilih template & orientasi.
            </p>
          </div>

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

          <p className="text-muted text-xs">
            Ukuran: {portrait ? "1080 × 1920 (9:16)" : "1920 × 1080 (16:9)"} · PNG
            {transparent ? " transparan" : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2 lg:w-[340px]">
          <span className="text-muted self-start text-xs font-semibold tracking-wide uppercase">
            Pratinjau
          </span>
          <div
            className="flex w-full items-center justify-center rounded-2xl border border-border p-3"
            style={transparent ? CHECKERBOARD : undefined}
          >
            <canvas ref={previewRef} className="h-auto w-full rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
