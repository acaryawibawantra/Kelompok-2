"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarCheck2, Flame, LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Ruang", icon: LayoutGrid },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/presensi", label: "Presensi", icon: CalendarCheck2 },
  { href: "/streak", label: "Streak", icon: Flame },
  { href: "/settings", label: "Setelan", icon: Settings },
] as const;

/**
 * Mobile bottom navigation (hidden >= lg where the sidebar takes over).
 * Native-app pattern: fixed, blurred backdrop, 48px targets, safe-area padding.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors duration-150",
                  active ? "text-brand-600" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 w-4 rounded-full transition-opacity duration-150",
                    active ? "bg-brand-600 opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
