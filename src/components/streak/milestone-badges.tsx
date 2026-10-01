"use client";

import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

const MILESTONES = [3, 7, 14, 30, 60, 100];

export function MilestoneBadges({ longest }: { longest: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {MILESTONES.map((milestone) => {
        const achieved = longest >= milestone;
        return (
          <div
            key={milestone}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors",
              achieved
                ? "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                : "border-border bg-surface-2/40 opacity-70",
            )}
            aria-label={`Milestone ${milestone} hari ${achieved ? "tercapai" : "belum tercapai"}`}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full",
                achieved
                  ? "bg-amber-500 text-white"
                  : "bg-surface text-muted",
              )}
            >
              <Award className="size-4.5" aria-hidden />
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{milestone}</span>
            <span className="text-[10px] text-muted">hari</span>
          </div>
        );
      })}
    </div>
  );
}
