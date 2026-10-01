"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { SubjectColumn } from "./subject-column";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { useCreateSubject } from "@/lib/queries";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ProjectDetail } from "@/lib/api";
import type { BoardView } from "@/lib/stores/ui-store";
import type { Task } from "@/types";

function NewSubjectInline({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createSubject = useCreateSubject(projectId);
  const { toast } = useToast();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const value = name.trim();
    if (!value) return;
    createSubject.mutate(
      { name: value },
      {
        onSuccess: () => {
          setName("");
          setOpen(false);
        },
        onError: () => toast({ title: "Gagal menambah subject", tone: "error" }),
      },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-[280px] shrink-0 snap-start items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface/40 text-sm font-medium text-muted transition-colors hover:border-brand-400 hover:text-brand-600"
      >
        <Plus className="size-4" aria-hidden />
        New Subject
      </button>
    );
  }

  return (
    <div className="flex h-12 w-[280px] shrink-0 snap-start items-center gap-1.5 rounded-card border border-brand-300 bg-surface px-2">
      <input
        ref={inputRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") {
            setName("");
            setOpen(false);
          }
        }}
        placeholder="Nama subject"
        aria-label="Nama subject baru"
        className="h-8 w-full bg-transparent px-1 text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          setName("");
          setOpen(false);
        }}
        aria-label="Batal"
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export interface BoardProps {
  detail: ProjectDetail;
  projectId: string;
  timezone: string;
  canEdit: boolean;
  view: BoardView;
}

export function Board({ detail, projectId, timezone, canEdit, view }: BoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksBySubject = (subjectId: string) =>
    detail.tasks.filter((task) => task.subjectId === subjectId);

  return (
    <>
      {view === "board" ? (
        <div
          className={cn(
            "no-scrollbar flex h-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6",
          )}
        >
          {detail.subjects.map((subject) => (
            <SubjectColumn
              key={subject.id}
              projectId={projectId}
              subject={subject}
              tasks={tasksBySubject(subject.id)}
              members={detail.members}
              timezone={timezone}
              canEdit={canEdit}
              onOpenDetail={setSelectedTask}
            />
          ))}
          {canEdit ? <NewSubjectInline projectId={projectId} /> : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-y-auto px-4 pb-6 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
          {detail.subjects.map((subject) => (
            <SubjectColumn
              key={subject.id}
              projectId={projectId}
              subject={subject}
              tasks={tasksBySubject(subject.id)}
              members={detail.members}
              timezone={timezone}
              canEdit={canEdit}
              onOpenDetail={setSelectedTask}
              className="h-[520px] w-full"
            />
          ))}
          {canEdit ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <NewSubjectInline projectId={projectId} />
            </div>
          ) : null}
        </div>
      )}

      <TaskDetailDrawer
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        projectId={projectId}
        members={detail.members}
        canEdit={canEdit}
      />
    </>
  );
}
