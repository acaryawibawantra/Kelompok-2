"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function ThemeManager() {
  const theme = useSettingsStore((state) => state.theme);
  const titleFont = useSettingsStore((state) => state.titleFont);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", isDark);
      root.dataset.theme = isDark ? "dark" : "light";
    };

    apply();
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.titleFont = titleFont;
  }, [titleFont]);

  return null;
}
