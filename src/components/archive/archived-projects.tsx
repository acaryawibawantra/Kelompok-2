"use client";

import { useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useDeleteProject, useProjects, useSetProjectArchived } from "@/lib/queries";
import type { Project } from "@/types";

function ArchivedProjectItem({ project }: { project: Project }) {
  const archive = useSetProjectArchived();
  const remove = useDeleteProject();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `${project.color}22` }}
      >
        {project.emoji ?? "🗂️"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
        <p className="text-xs text-muted">
          {project.taskStats.done}/{project.taskStats.total} task selesai
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          archive.mutate(
            { projectId: project.id, archived: false },
            { onSuccess: () => toast({ title: `"${project.name}" dipulihkan`, tone: "success" }) },
          )
        }
      >
        <ArchiveRestore className="size-4" aria-hidden />
        Pulihkan
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Hapus permanen ${project.name}`}
        className="text-danger hover:bg-danger-soft dark:hover:bg-rose-900/30"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          remove.mutate(project.id, {
            onSuccess: () => {
              setConfirmOpen(false);
              toast({ title: "Project dihapus permanen", tone: "success" });
            },
          })
        }
        title={`Hapus permanen "${project.name}"?`}
        description="Project beserta seluruh subject dan task akan hilang selamanya."
        confirmLabel="Hapus permanen"
        loading={remove.isPending}
      />
    </div>
  );
}

export function ArchivedProjects() {
  const { data, isLoading } = useProjects("all", true);

  return (
    <section aria-labelledby="archived-projects-title" className="space-y-3">
      <h2 id="archived-projects-title" className="font-title text-2xl text-foreground">
        Project terarsip
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          Belum ada yang diarsipkan.
        </p>
      ) : (
        <div className="space-y-2">
          {data?.map((project) => <ArchivedProjectItem key={project.id} project={project} />)}
        </div>
      )}
    </section>
  );
}
