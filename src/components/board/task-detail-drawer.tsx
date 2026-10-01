"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useDeleteTask, useUpdateTask } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Member, Priority, Task } from "@/types";

const selectClass =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:border-brand-400";

export interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: Member[];
  canEdit: boolean;
}

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  projectId,
  members,
  canEdit,
}: TaskDetailDrawerProps) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [syncedTaskId, setSyncedTaskId] = useState<string | null>(null);

  if (task && task.id !== syncedTaskId) {
    setSyncedTaskId(task.id);
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setDueDate(task.dueDate ?? "");
    setPriority(task.priority ?? "");
    setAssigneeId(task.assigneeId ?? "");
  }

  function handleSave() {
    if (!task) return;
    const nextTitle = title.trim();
    if (!nextTitle) {
      toast({ title: "Judul task tidak boleh kosong", tone: "error" });
      return;
    }
    updateTask.mutate(
      {
        id: task.id,
        input: {
          title: nextTitle,
          notes: notes.trim() ? notes : null,
          dueDate: dueDate || null,
          priority: priority || null,
          assigneeId: assigneeId || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Detail task disimpan", tone: "success" });
          onClose();
        },
        onError: () => toast({ title: "Gagal menyimpan task", tone: "error" }),
      },
    );
  }

  return (
    <>
      <Drawer
        open={open && Boolean(task)}
        onClose={onClose}
        title="Detail Task"
        description="Perbarui informasi task ini."
        footer={
          canEdit ? (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="ghost"
                className="text-danger hover:bg-danger-soft dark:hover:bg-rose-900/30"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Hapus
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Batal
                </Button>
                <Button onClick={handleSave} loading={updateTask.isPending}>
                  Simpan
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Tutup
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <Field label="Judul" htmlFor="task-title" required>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Catatan" htmlFor="task-notes" hint="Maksimal 5000 karakter.">
            <Textarea
              id="task-notes"
              rows={5}
              maxLength={5000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canEdit}
              placeholder="Tambahkan detail, langkah, atau link referensi…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Jatuh tempo" htmlFor="task-due">
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={!canEdit}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority">Prioritas</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority | "")}
                disabled={!canEdit}
                className={cn(selectClass)}
              >
                <option value="">Tanpa prioritas</option>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-assignee">Ditugaskan ke</Label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              disabled={!canEdit}
              className={cn(selectClass)}
            >
              <option value="">Belum ditugaskan</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {task ? (
            <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
              Dibuat {new Date(task.createdAt).toLocaleDateString("id-ID")}
              {task.completedAt
                ? ` · Selesai ${new Date(task.completedAt).toLocaleDateString("id-ID")}`
                : ""}
            </div>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!task) return;
          deleteTask.mutate(task.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              onClose();
              toast({ title: "Task dihapus", tone: "success" });
            },
          });
        }}
        title="Hapus task ini?"
        description="Task akan dihapus permanen."
        confirmLabel="Hapus"
        loading={deleteTask.isPending}
      />
    </>
  );
}
