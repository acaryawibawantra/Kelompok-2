"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { ThemeMode } from "@/types";

const order: ThemeMode[] = ["light", "dark", "system"];

const labels: Record<ThemeMode, string> = {
  light: "Tema terang",
  dark: "Tema gelap",
  system: "Mengikuti sistem",
};

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const next = order[(order.indexOf(theme) + 1) % order.length]!;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${labels[theme]}. Klik untuk ${labels[next].toLowerCase()}`}
      title={labels[theme]}
      className={className}
    >
      {theme === "dark" ? (
        <Moon className="size-4.5" aria-hidden />
      ) : theme === "system" ? (
        <Monitor className="size-4.5" aria-hidden />
      ) : (
        <Sun className="size-4.5" aria-hidden />
      )}
    </button>
  );
}
