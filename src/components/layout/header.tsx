"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { StreakBadge } from "./streak-badge";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useUiStore } from "@/lib/stores/ui-store";

const TITLES: Record<string, string> = {
  archive: "Archive",
  calendar: "Calendar",
  streak: "Streak",
  settings: "Pengaturan",
  invites: "Undangan",
  projects: "Projects",
};

function breadcrumbFor(pathname: string): { label: string; href: string }[] {
  if (pathname === "/") return [{ label: "My Space", href: "/" }];
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const label = TITLES[segment] ?? "My Space";
  const crumbs = [{ label: "My Space", href: "/" }];
  if (segment && segment !== "") crumbs.push({ label, href: `/${segment}` });
  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const crumbs = breadcrumbFor(pathname);

  return (
    <header className="border-border bg-canvas/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Buka menu"
        className="text-muted hover:bg-surface-2 hover:text-foreground grid size-9 place-items-center rounded-lg lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <span className="text-muted/60 hidden sm:inline" aria-hidden>
                  /
                </span>
              ) : null}
              {index === crumbs.length - 1 ? (
                <span className="text-foreground truncate font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted hover:text-foreground hidden truncate sm:inline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Cari project atau aksi"
          className="border-border bg-surface text-muted hover:border-brand-300 hover:text-foreground hidden h-9 items-center gap-2 rounded-xl border px-3 text-sm transition-colors md:flex"
        >
          <Search className="size-4" aria-hidden />
          <span className="w-32 text-left">Cari…</span>
          <kbd className="border-border bg-surface-2 rounded-md border px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Cari"
          className="text-muted hover:bg-surface-2 hover:text-foreground grid size-9 place-items-center rounded-lg md:hidden"
        >
          <Search className="size-5" aria-hidden />
        </button>
        <StreakBadge />
        <ThemeToggle className="text-muted hover:bg-surface-2 hover:text-foreground grid size-9 place-items-center rounded-lg" />
        <UserMenu />
      </div>
    </header>
  );
}
