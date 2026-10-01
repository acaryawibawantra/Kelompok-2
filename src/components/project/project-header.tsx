"use client";

import { PresenceStack } from "@/components/collab/presence-stack";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import type { BoardView } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Member, Project } from "@/types";

export interface ProjectHeaderProps {
  project: Project;
  members: Member[];
  onlineIds?: Set<string>;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function ProjectHeader({
  project,
  members,
  onlineIds,
  view,
  onViewChange,
  actions,
  className,
}: ProjectHeaderProps) {
  const { total, done } = project.taskStats;

  return (
    <div className={cn("flex flex-col gap-4 py-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-soft"
            style={{ backgroundColor: `${project.color}22` }}
          >
            {project.emoji ?? "🗂️"}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Canvas
            </p>
            <h1 className="truncate font-title text-4xl leading-tight text-foreground">
              {project.name}
            </h1>
            {project.description ? (
              <p className="mt-0.5 line-clamp-1 max-w-xl text-sm text-muted">
                {project.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <PresenceStack members={members} onlineIds={onlineIds} />
          </div>
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Progress value={done} max={total || 1} label={`Progres ${project.name}`} />
          <p className="text-xs text-muted">
            <span className="font-medium text-foreground tabular-nums">{done}</span>/{total} task
            diselesaikan
          </p>
        </div>
        <Segmented<BoardView>
          ariaLabel="Tampilan project"
          size="sm"
          value={view}
          onChange={onViewChange}
          options={[
            { value: "board", label: "Board" },
            { value: "grid", label: "Grid" },
          ]}
        />
      </div>
    </div>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-56" />
        </div>
      </div>
      <Skeleton className="h-2 w-full max-w-md" />
    </div>
  );
}
