"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { StreakBadge } from "./streak-badge";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useUiStore } from "@/lib/stores/ui-store";

const TITLES: Record<string, string> = {
  archive: "Archive",
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
  const crumbs = breadcrumbFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-canvas/85 px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Buka menu"
        className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <span className="hidden text-muted/60 sm:inline" aria-hidden>
                  /
                </span>
              ) : null}
              {index === crumbs.length - 1 ? (
                <span className="truncate font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hidden truncate text-muted hover:text-foreground sm:inline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        <StreakBadge />
        <ThemeToggle className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground" />
        <UserMenu />
      </div>
    </header>
  );
}
