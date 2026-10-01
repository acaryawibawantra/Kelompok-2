"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useStreak } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function StreakBadge({ className }: { className?: string }) {
  const { data, isLoading } = useStreak();

  return (
    <Link
      href="/streak"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100",
        "dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
        className,
      )}
      aria-label="Lihat halaman streak"
    >
      <Flame className="size-4 fill-amber-500 text-amber-500" aria-hidden />
      {isLoading ? (
        <span className="inline-block h-4 w-5 animate-pulse rounded bg-amber-200/70 dark:bg-amber-900/50" />
      ) : (
        <span className="tabular-nums">{data?.current ?? 0}</span>
      )}
      <span className="sr-only">hari beruntun</span>
    </Link>
  );
}
