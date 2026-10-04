"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CalendarDays,
  Flame,
  Folder,
  LayoutGrid,
  Mail,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { useProjects } from "@/lib/queries";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: React.ReactNode;
  run: () => void;
}

function buildCommands(projects: Project[], router: ReturnType<typeof useRouter>): Command[] {
  const navigation: Command[] = [
    {
      id: "new-project",
      label: "New Project",
      hint: "Aksi",
      keywords: "buat tambah project",
      icon: <Plus className="size-4" aria-hidden />,
      run: () => useUiStore.getState().setNewProjectOpen(true),
    },
    {
      id: "my-space",
      label: "My Space",
      hint: "Navigasi",
      icon: <LayoutGrid className="size-4" aria-hidden />,
      run: () => router.push("/"),
    },
    {
      id: "calendar",
      label: "Calendar",
      hint: "Navigasi",
      keywords: "jadwal kalender tenggat deadline",
      icon: <CalendarDays className="size-4" aria-hidden />,
      run: () => router.push("/calendar"),
    },
    {
      id: "archive",
      label: "Archive",
      hint: "Navigasi",
      icon: <Archive className="size-4" aria-hidden />,
      run: () => router.push("/archive"),
    },
    {
      id: "streak",
      label: "Streak",
      hint: "Navigasi",
      icon: <Flame className="size-4" aria-hidden />,
      run: () => router.push("/streak"),
    },
    {
      id: "invites",
      label: "Undangan",
      hint: "Navigasi",
      icon: <Mail className="size-4" aria-hidden />,
      run: () => router.push("/invites"),
    },
    {
      id: "settings",
      label: "Pengaturan",
      hint: "Navigasi",
      icon: <Settings className="size-4" aria-hidden />,
      run: () => router.push("/settings"),
    },
  ];
  const projectCommands: Command[] = projects.map((project) => ({
    id: `project-${project.id}`,
    label: project.name,
    hint: "Project",
    keywords: project.description ?? undefined,
    icon: <Folder className="size-4" aria-hidden />,
    run: () => router.push(`/projects/${project.id}`),
  }));
  return [...navigation, ...projectCommands];
}

function PaletteDialog({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => buildCommands(projects, router), [projects, router]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(value) ||
        (command.keywords?.toLowerCase().includes(value) ?? false),
    );
  }, [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function select(command: Command | undefined) {
    if (!command) return;
    onClose();
    command.run();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="rounded-card border-border bg-surface shadow-pop relative z-10 w-full max-w-lg overflow-hidden border"
      >
        <div className="border-border flex items-center gap-2 border-b px-4">
          <Search className="text-muted size-4 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                select(filtered[activeIndex]);
              }
              if (event.key === "Escape") onClose();
            }}
            placeholder="Cari project atau aksi…"
            aria-label="Cari"
            className="text-foreground placeholder:text-muted/70 h-12 w-full bg-transparent text-sm focus:outline-none"
          />
          <kbd className="border-border bg-surface-2 text-muted hidden rounded-md border px-1.5 py-0.5 text-[10px] sm:block">
            Esc
          </kbd>
        </div>

        <ul role="listbox" aria-label="Hasil" className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="text-muted px-3 py-6 text-center text-sm">
              Tidak ada hasil untuk “{query}”.
            </li>
          ) : (
            filtered.map((command, index) => (
              <li key={command.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(command)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex
                      ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
                      : "text-foreground hover:bg-surface-2",
                  )}
                >
                  <span className="text-muted">{command.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {command.hint ? (
                    <span className="text-muted text-[11px]">{command.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </motion.div>
    </div>
  );
}

export function CommandPalette() {
  const hydrated = useHydrated();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const { data: projects } = useProjects("all", false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <PaletteDialog key="palette" projects={projects ?? []} onClose={() => setOpen(false)} />
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
