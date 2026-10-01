"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { TaskItem } from "./task-item";
import { ActionMenu } from "@/components/ui/action-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import {
  useClearCompleted,
  useCreateTask,
  useDeleteSubject,
  useUpdateSubject,
} from "@/lib/queries";
import { useFilterStore } from "@/lib/stores/filter-store";
import { cn } from "@/lib/utils";
import type { Member, Subject, Task, TaskFilter } from "@/types";

export interface SubjectColumnProps {
  projectId: string;
  subject: Subject;
  tasks: Task[];
  members: Member[];
  timezone: string;
  canEdit: boolean;
  onOpenDetail: (task: Task) => void;
  dragHandle?: React.ReactNode;
  className?: string;
}

function AddTaskInline({ subjectId, projectId }: { subjectId: string; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask(projectId);
  const { toast } = useToast();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const value = title.trim();
    if (!value) return;
    createTask.mutate(
      { subjectId, input: { title: value } },
      {
        onSuccess: () => {
          setTitle("");
          inputRef.current?.focus();
        },
        onError: () => toast({ title: "Gagal menambah task", tone: "error" }),
      },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden />
        Add Task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        placeholder="Judul task, Enter untuk simpan"
        aria-label="Judul task baru"
        className="h-9 w-full rounded-lg border border-brand-300 bg-surface px-2.5 text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          setTitle("");
          setOpen(false);
        }}
        aria-label="Batal"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={submit}
        aria-label="Simpan task"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function SubjectColumn({
  projectId,
  subject,
  tasks,
  members,
  timezone,
  canEdit,
  onOpenDetail,
  dragHandle,
  className,
}: SubjectColumnProps) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(subject.name);
  const [syncedName, setSyncedName] = useState(subject.name);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  if (subject.name !== syncedName) {
    setSyncedName(subject.name);
    setName(subject.name);
  }

  const filter = useFilterStore((state) => state.filters[subject.id] ?? "all");
  const setFilter = useFilterStore((state) => state.setFilter);
  const updateSubject = useUpdateSubject(projectId);
  const deleteSubject = useDeleteSubject(projectId);
  const clearCompleted = useClearCompleted(projectId);
  const { toast } = useToast();

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const total = tasks.length;
  const done = tasks.filter((task) => task.isDone).length;
  const remaining = total - done;
  const filtered =
    filter === "active"
      ? tasks.filter((task) => !task.isDone)
      : filter === "done"
        ? tasks.filter((task) => task.isDone)
        : tasks;

  function commitName() {
    const next = name.trim();
    setEditingName(false);
    if (!next || next === subject.name) {
      setName(subject.name);
      return;
    }
    updateSubject.mutate({ id: subject.id, input: { name: next } });
  }

  return (
    <section
      aria-label={`Subject ${subject.name}`}
      className={cn(
        "flex h-full w-[300px] shrink-0 snap-start flex-col rounded-card border border-border bg-surface-2/50 shadow-soft",
        className,
      )}
    >
      <div
        className="h-1.5 rounded-t-card"
        style={{ backgroundColor: subject.color ?? "var(--color-brand-400)" }}
        aria-hidden
      />

      <header className="flex items-start gap-1 px-3 pt-3">
        {dragHandle}
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              ref={nameRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitName();
                if (event.key === "Escape") {
                  setName(subject.name);
                  setEditingName(false);
                }
              }}
              className="w-full rounded-md border border-brand-300 bg-surface px-1.5 py-0.5 font-title text-xl focus:outline-none"
              aria-label="Edit nama subject"
            />
          ) : (
            <h2 className="font-title text-2xl leading-tight text-foreground">
              <button
                type="button"
                onClick={() => canEdit && setEditingName(true)}
                className="text-left"
                disabled={!canEdit}
              >
                {subject.name}
              </button>
            </h2>
          )}
          <p className="text-xs text-muted">
            {total} task · {done} selesai
          </p>
        </div>
        {canEdit ? (
          <ActionMenu
            label={`Menu subject ${subject.name}`}
            trigger={<MoreHorizontal className="size-4" aria-hidden />}
            items={[
              {
                id: "rename",
                label: "Ubah nama",
                icon: <Pencil className="size-4" aria-hidden />,
                onSelect: () => setEditingName(true),
              },
              {
                id: "delete",
                label: "Hapus subject",
                tone: "danger",
                icon: <Trash2 className="size-4" aria-hidden />,
                onSelect: () => setConfirmDelete(true),
              },
            ]}
          />
        ) : null}
      </header>

      <div className="px-3 pt-2.5">
        <Segmented<TaskFilter>
          ariaLabel={`Filter task ${subject.name}`}
          size="sm"
          value={filter}
          onChange={(value) => setFilter(subject.id, value)}
          options={[
            { value: "all", label: "Semua", count: total },
            { value: "active", label: "Aktif", count: remaining },
            { value: "done", label: "Selesai", count: done },
          ]}
        />
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2.5">
        {filtered.length === 0 ? (
          <div className="px-1 py-4">
            <p className="text-center text-xs text-muted">
              {total === 0
                ? "Belum ada task di subject ini."
                : filter === "done"
                  ? "Belum ada task selesai."
                  : "Tidak ada task aktif."}
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const assignee = task.assigneeId
              ? members.find((member) => member.userId === task.assigneeId)
              : undefined;
            return (
              <TaskItem
                key={task.id}
                task={task}
                projectId={projectId}
                timezone={timezone}
                canEdit={canEdit}
                assigneeName={assignee?.name}
                assigneeColor={assignee?.avatarColor}
                onOpenDetail={onOpenDetail}
              />
            );
          })
        )}
      </div>

      <footer className="space-y-1.5 border-t border-border px-3 py-2.5">
        {canEdit ? <AddTaskInline subjectId={subject.id} projectId={projectId} /> : null}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {remaining} task tersisa
          </span>
          {canEdit && done > 0 ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Hapus yang Selesai
            </button>
          ) : null}
        </div>
      </footer>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() =>
          clearCompleted.mutate(subject.id, {
            onSuccess: (result) => {
              setConfirmClear(false);
              toast({ title: `${result.deleted} task selesai dihapus`, tone: "success" });
            },
          })
        }
        title="Hapus semua task selesai?"
        description={`Task selesai di "${subject.name}" akan dihapus. Task aktif tetap aman.`}
        confirmLabel="Hapus yang selesai"
        loading={clearCompleted.isPending}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteSubject.mutate(subject.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast({ title: `Subject "${subject.name}" dihapus`, tone: "success" });
            },
          })
        }
        title={`Hapus subject "${subject.name}"?`}
        description="Semua task di dalam subject ini akan ikut terhapus."
        confirmLabel="Hapus subject"
        loading={deleteSubject.isPending}
      />
    </section>
  );
}
