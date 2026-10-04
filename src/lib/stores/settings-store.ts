"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode, TitleFont } from "@/types";

export interface SettingsState {
  theme: ThemeMode;
  titleFont: TitleFont;
  dailyGoal: number;
  setTheme: (theme: ThemeMode) => void;
  setTitleFont: (font: TitleFont) => void;
  setDailyGoal: (goal: number) => void;
  hydrateFromUser: (settings: {
    theme: ThemeMode;
    titleFont: TitleFont;
    dailyGoal: number;
  }) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      titleFont: "modern",
      dailyGoal: 3,
      setTheme: (theme) => set({ theme }),
      setTitleFont: (titleFont) => set({ titleFont }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      hydrateFromUser: (settings) => set(settings),
    }),
    {
      name: "tc-settings",
      partialize: (state) => ({
        theme: state.theme,
        titleFont: state.titleFont,
        dailyGoal: state.dailyGoal,
      }),
    },
  ),
);
