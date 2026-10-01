"use client";

import { create } from "zustand";
import type { TaskFilter } from "@/types";

interface FilterState {
  filters: Record<string, TaskFilter>;
  getFilter: (subjectId: string) => TaskFilter;
  setFilter: (subjectId: string, filter: TaskFilter) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  filters: {},
  getFilter: (subjectId) => get().filters[subjectId] ?? "all",
  setFilter: (subjectId, filter) =>
    set((state) => ({ filters: { ...state.filters, [subjectId]: filter } })),
}));
