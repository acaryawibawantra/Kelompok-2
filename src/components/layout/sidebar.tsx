"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Flame,
  FolderKanban,
  LayoutGrid,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvites, useProjects } from "@/lib/queries";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "My Space", icon: LayoutGrid },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/streak", label: "Streak", icon: Flame },
  { href: "/invites", label: "Undangan", icon: Mail },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/projects");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const projectsQuery = useProjects("all", false);
  const invitesQuery = useInvites();
  const setNewProjectOpen = useUiStore((state) => state.setNewProjectOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const pendingInvites = invitesQuery.data?.length ?? 0;

  const projects: Project[] = projectsQuery.data ?? [];

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between")}>
        <Logo collapsed={collapsed} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Lebarkan sidebar" : "Ringkas sidebar"}
            className="hidden size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground lg:grid"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Tutup menu"
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground lg:hidden"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="mt-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileNavOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              {!collapsed ? <span>{item.label}</span> : null}
              {!collapsed && item.href === "/invites" && pendingInvites > 0 ? (
                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                  {pendingInvites}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <FolderKanban className="size-3.5" aria-hidden />
              Projects
            </span>
            <span className="text-xs text-muted/80">{projects.length}</span>
          </div>
          <div className="no-scrollbar -mx-1 flex-1 overflow-y-auto px-1">
            {projectsQuery.isLoading ? (
              <div className="space-y-2 px-2 py-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-5/6" />
                <Skeleton className="h-8 w-4/6" />
              </div>
            ) : projects.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted">Belum ada project.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {projects.map((project) => {
                  const active = pathname === `/projects/${project.id}`;
                  return (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-surface-2 font-medium text-foreground"
                            : "text-muted hover:bg-surface-2 hover:text-foreground",
                        )}
                      >
                        <span
                          aria-hidden
                          className="grid size-6 shrink-0 place-items-center rounded-md text-xs"
                          style={{ backgroundColor: `${project.color}22` }}
                        >
                          {project.emoji ?? "•"}
                        </span>
                        <span className="truncate">{project.name}</span>
                        {project.isFavorite ? (
                          <span className="ml-auto text-amber-500" aria-label="Favorit">
                            ★
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full justify-center"
            onClick={() => {
              setNewProjectOpen(true);
              setMobileNavOpen(false);
            }}
          >
            <Plus className="size-4" aria-hidden />
            New Project
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-1 flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setNewProjectOpen(true)}
            aria-label="Buat project baru"
            className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className={cn("mt-auto flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center")}>
        <UserMenu />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Profil</p>
            <Link href="/settings" className="text-xs text-muted hover:text-foreground">
              Pengaturan
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Sidebar() {
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-surface transition-[width] duration-200 lg:block",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] border-r border-border bg-surface shadow-pop">
            <SidebarContent />
          </div>
        </div>
      ) : null}
    </>
  );
}
