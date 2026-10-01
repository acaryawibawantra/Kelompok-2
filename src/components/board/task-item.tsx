"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  CalendarDays,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { useUpdateTask, useDeleteTask } from "@/lib/queries";
import { formatDueDate, isOverdue, isToday } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/types";

const priorityColor: Record<Priority, string> = {
  high: "bg-danger",
  medium: "bg-amber-500",
  low: "bg-brand-400",
};

const priorityLabel: Record<Priority, string> = {
  high: "Prioritas tinggi",
  medium: "Prioritas sedang",
  low: "Prioritas rendah",
};

export interface TaskItemProps {
  task: Task;
  projectId: string;
  timezone: string;
  canEdit: boolean;
  assigneeName?: string | null;
  assigneeColor?: string | null;
  onOpenDetail: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskItem({
  task,
  projectId,
  timezone,
  canEdit,
  assigneeName,
  assigneeColor,
  onOpenDetail,
  isDragging = false,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [syncedTitle, setSyncedTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { toast } = useToast();

  if (task.title !== syncedTitle) {
    setSyncedTitle(task.title);
    setTitle(task.title);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const overdue = !task.isDone && isOverdue(task.dueDate, timezone);
  const dueToday = !task.isDone && isToday(task.dueDate, timezone);

  function commitTitle() {
    const next = title.trim();
    setEditing(false);
    if (!next || next === task.title) {
      setTitle(task.title);
      return;
    }
    updateTask.mutate(
      { id: task.id, input: { title: next } },
      { onError: () => toast({ title: "Gagal mengubah judul task", tone: "error" }) },
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2.5 rounded-xl border border-transparent bg-surface px-2.5 py-2 transition-colors hover:border-border hover:bg-surface-2/60",
        task.isDone && "opacity-70",
        isDragging && "shadow-card ring-2 ring-brand-400",
      )}
    >
      {canEdit ? (
        <span
          className="mt-1 hidden cursor-grab touch-none text-muted/50 group-hover:block"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>
      ) : null}

      <div className="mt-0.5">
        <Checkbox
          checked={task.isDone}
          disabled={!canEdit}
          label={`Tandai "${task.title}" ${task.isDone ? "belum selesai" : "selesai"}`}
          onCheckedChange={(checked) => {
            updateTask.mutate(
              { id: task.id, input: { isDone: checked } },
              { onError: () => toast({ title: "Gagal memperbarui task", tone: "error" }) },
            );
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTitle();
              }
              if (event.key === "Escape") {
                setTitle(task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-brand-300 bg-surface px-1.5 py-0.5 text-sm focus:outline-none"
            aria-label="Edit judul task"
          />
        ) : (
          <button
            type="button"
            onClick={() => (canEdit ? setEditing(true) : onOpenDetail(task))}
            className={cn(
              "block w-full text-left text-sm leading-snug text-foreground",
              task.isDone && "line-through text-muted",
            )}
          >
            {task.title}
          </button>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.priority ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <span
                className={cn("size-1.5 rounded-full", priorityColor[task.priority])}
                aria-hidden
              />
              {priorityLabel[task.priority]}
            </span>
          ) : null}

          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                overdue
                  ? "bg-danger-soft text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                  : dueToday
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    : "bg-surface-2 text-muted",
              )}
            >
              <CalendarDays className="size-3" aria-hidden />
              {formatDueDate(task.dueDate, timezone)}
            </span>
          ) : null}

          {assigneeName ? (
            <Avatar
              name={assigneeName}
              color={assigneeColor ?? undefined}
              size="xs"
              title={`Ditugaskan ke ${assigneeName}`}
            />
          ) : null}
        </div>
      </div>

      <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <ActionMenu
          label={`Menu task ${task.title}`}
          items={[
            {
              id: "detail",
              label: "Edit detail",
              icon: <Pencil className="size-4" aria-hidden />,
              onSelect: () => onOpenDetail(task),
            },
            {
              id: "archive",
              label: "Arsipkan",
              icon: <Archive className="size-4" aria-hidden />,
              onSelect: () =>
                updateTask.mutate(
                  { id: task.id, input: { isArchived: true } },
                  { onSuccess: () => toast({ title: "Task diarsipkan", tone: "info" }) },
                ),
              disabled: !canEdit,
            },
            {
              id: "delete",
              label: "Hapus",
              tone: "danger",
              icon: <Trash2 className="size-4" aria-hidden />,
              onSelect: () =>
                deleteTask.mutate(task.id, {
                  onSuccess: () => toast({ title: "Task dihapus", tone: "success" }),
                }),
              disabled: !canEdit,
            },
          ]}
        />
      </div>
    </div>
  );
}
