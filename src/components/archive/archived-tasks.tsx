"use client";

import { useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useArchivedTasks, useDeleteTask, useUpdateTask } from "@/lib/queries";
import type { ArchivedTask } from "@/lib/api";

function ArchivedTaskItem({ task }: { task: ArchivedTask }) {
  const updateTask = useUpdateTask(task.projectId);
  const deleteTask = useDeleteTask(task.projectId);
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <p className="truncate text-xs text-muted">
          {task.projectName} · {task.subjectName}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          updateTask.mutate(
            { id: task.id, input: { isArchived: false } },
            { onSuccess: () => toast({ title: "Task dipulihkan", tone: "success" }) },
          )
        }
      >
        <ArchiveRestore className="size-4" aria-hidden />
        Pulihkan
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Hapus permanen ${task.title}`}
        className="text-danger hover:bg-danger-soft dark:hover:bg-rose-900/30"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteTask.mutate(task.id, {
            onSuccess: () => {
              setConfirmOpen(false);
              toast({ title: "Task dihapus permanen", tone: "success" });
            },
          })
        }
        title="Hapus permanen task ini?"
        description="Task akan hilang selamanya."
        confirmLabel="Hapus permanen"
        loading={deleteTask.isPending}
      />
    </div>
  );
}

export function ArchivedTasks() {
  const { data, isLoading } = useArchivedTasks();

  return (
    <section aria-labelledby="archived-tasks-title" className="space-y-3">
      <h2 id="archived-tasks-title" className="font-title text-2xl text-foreground">
        Task terarsip
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
          {data?.map((task) => <ArchivedTaskItem key={task.id} task={task} />)}
        </div>
      )}
    </section>
  );
}
