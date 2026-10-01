"use client";

import { create } from "zustand";

export type BoardView = "board" | "grid";

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  newProjectOpen: boolean;
  boardView: BoardView;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setNewProjectOpen: (open: boolean) => void;
  setBoardView: (view: BoardView) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
  newProjectOpen: false,
  boardView: "board",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),
  setBoardView: (boardView) => set({ boardView }),
}));
