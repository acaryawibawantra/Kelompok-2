"use client";

import { Check } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import type { ThemeMode, TitleFont } from "@/types";

const FONTS: Array<{ value: TitleFont; label: string; cssVar: string; sample: string }> = [
  {
    value: "handwritten",
    label: "Handwritten",
    cssVar: "var(--font-handwritten)",
    sample: "My Space",
  },
  {
    value: "modern",
    label: "Bersih & Modern",
    cssVar: "var(--font-modern)",
    sample: "My Space",
  },
  {
    value: "serif",
    label: "Klasik Serif",
    cssVar: "var(--font-serif)",
    sample: "My Space",
  },
];

export function FontPicker({
  value,
  onChange,
}: {
  value: TitleFont;
  onChange: (font: TitleFont) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Gaya font judul"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {FONTS.map((font) => {
        const active = value === font.value;
        return (
          <button
            key={font.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(font.value)}
            className={cn(
              "relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
              active
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                : "border-border bg-surface hover:border-brand-300",
            )}
          >
            {active ? (
              <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            ) : null}
            <span className="text-3xl leading-none text-foreground" style={{ fontFamily: font.cssVar }}>
              {font.sample}
            </span>
            <span className="text-sm font-medium text-foreground">{font.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  return (
    <Segmented<ThemeMode>
      ariaLabel="Pilih tema"
      value={value}
      onChange={onChange}
      options={[
        { value: "light", label: "Terang" },
        { value: "dark", label: "Gelap" },
        { value: "system", label: "Sistem" },
      ]}
    />
  );
}
