"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCreateProject, useProject, useUpdateProject } from "@/lib/queries";
import { useUiStore } from "@/lib/stores/ui-store";
import { createProjectSchema } from "@/lib/schemas";
import { zodFieldErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

const EMOJIS = [
  "📚",
  "🧩",
  "🌱",
  "🔬",
  "📷",
  "💼",
  "🚀",
  "🎯",
  "💡",
  "📝",
  "🏠",
  "🎨",
  "🧪",
  "💻",
  "📊",
  "🛒",
  "✈️",
  "🍳",
  "🏋️",
  "🎓",
];

const COLORS = [
  "#5b5ce2",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#f97316",
  "#6366f1",
];

export function NewProjectModal() {
  const newProjectOpen = useUiStore((state) => state.newProjectOpen);
  const setNewProjectOpen = useUiStore((state) => state.setNewProjectOpen);
  const editingProjectId = useUiStore((state) => state.editingProjectId);
  const setEditingProject = useUiStore((state) => state.setEditingProject);
  const router = useRouter();
  const { toast } = useToast();

  const isEditing = Boolean(editingProjectId);
  const open = newProjectOpen || isEditing;

  const editingQuery = useProject(editingProjectId ?? "");
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(editingProjectId ?? "");

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState(COLORS[0]!);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [syncedKey, setSyncedKey] = useState<string | null>(null);

  const project = editingQuery.data?.project;

  if (isEditing && project && project.id !== syncedKey) {
    setSyncedKey(project.id);
    setName(project.name);
    setEmoji(project.emoji ?? "📚");
    setColor(project.color);
    setDescription(project.description ?? "");
  }

  function reset() {
    setName("");
    setEmoji("📚");
    setColor(COLORS[0]!);
    setDescription("");
    setErrors({});
  }

  function close() {
    setNewProjectOpen(false);
    setEditingProject(null);
    reset();
  }

  function handleSubmit() {
    const parsed = createProjectSchema.safeParse({
      name,
      emoji,
      color,
      description: description.trim() ? description : null,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});

    if (isEditing && editingProjectId) {
      updateProject.mutate(parsed.data, {
        onSuccess: () => {
          toast({ title: "Project diperbarui", tone: "success" });
          close();
        },
        onError: () => toast({ title: "Gagal memperbarui project", tone: "error" }),
      });
      return;
    }

    createProject.mutate(parsed.data, {
      onSuccess: (created) => {
        toast({ title: `Project "${created.name}" dibuat`, tone: "success" });
        close();
        router.push(`/projects/${created.id}`);
      },
      onError: () => toast({ title: "Gagal membuat project", tone: "error" }),
    });
  }

  const pending = createProject.isPending || updateProject.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEditing ? "Edit Project" : "New Project"}
      description={isEditing ? "Perbarui detail project." : "Buat wadah baru untuk subject dan task."}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={pending}>
            {isEditing ? "Simpan" : "Buat project"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama project" htmlFor="project-name" required error={errors.name}>
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Kuliah Semester 5"
            maxLength={80}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Emoji</span>
          <div
            role="radiogroup"
            aria-label="Pilih emoji project"
            className="grid grid-cols-10 gap-1"
          >
            {EMOJIS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={emoji === item}
                aria-label={`Emoji ${item}`}
                onClick={() => setEmoji(item)}
                className={cn(
                  "grid size-8 place-items-center rounded-lg text-lg transition-colors",
                  emoji === item
                    ? "bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-900/40"
                    : "hover:bg-surface-2",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Warna</span>
          <div role="radiogroup" aria-label="Pilih warna project" className="flex flex-wrap gap-2">
            {COLORS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={color === item}
                aria-label={`Warna ${item}`}
                onClick={() => setColor(item)}
                className={cn(
                  "size-8 rounded-full transition-transform",
                  color === item
                    ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-surface"
                    : "hover:scale-110",
                )}
                style={{ backgroundColor: item }}
              />
            ))}
          </div>
        </div>

        <Field
          label="Deskripsi"
          htmlFor="project-description"
          hint="Opsional, maksimal 1000 karakter."
        >
          <Textarea
            id="project-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tujuan atau catatan singkat project…"
          />
        </Field>
      </div>
    </Modal>
  );
}
