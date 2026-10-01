"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Pencil, Star, Trash2, Users } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import {
  useDeleteProject,
  useProjectMembers,
  useSetProjectArchived,
  useSetProjectFavorite,
} from "@/lib/queries";
import { useUiStore } from "@/lib/stores/ui-store";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  const members = useProjectMembers(project.id);
  const favorite = useSetProjectFavorite();
  const archive = useSetProjectArchived();
  const remove = useDeleteProject();
  const setEditingProject = useUiStore((state) => state.setEditingProject);
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { total, done } = project.taskStats;
  const complete = total > 0 && done === total;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <div
        className="relative h-20"
        style={{
          background: `linear-gradient(135deg, ${project.color}26, ${project.color}0d)`,
        }}
      >
        <span
          aria-hidden
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-2xl bg-surface text-xl shadow-soft"
        >
          {project.emoji ?? "🗂️"}
        </span>
        <button
          type="button"
          onClick={() => favorite.mutate({ projectId: project.id, value: !project.isFavorite })}
          aria-label={project.isFavorite ? "Hapus dari favorit" : "Tandai favorit"}
          aria-pressed={project.isFavorite}
          className={cn(
            "absolute right-12 top-3 z-10 grid size-8 place-items-center rounded-lg transition-colors",
            project.isFavorite
              ? "text-amber-500 hover:bg-amber-100/60"
              : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Star className={cn("size-4", project.isFavorite && "fill-current")} aria-hidden />
        </button>
        <div className="absolute right-2 top-3 z-10">
          <ActionMenu
            label={`Menu project ${project.name}`}
            items={[
              {
                id: "edit",
                label: "Edit project",
                icon: <Pencil className="size-4" aria-hidden />,
                onSelect: () => setEditingProject(project.id),
              },
              {
                id: "archive",
                label: "Arsipkan",
                icon: <Archive className="size-4" aria-hidden />,
                onSelect: () =>
                  archive.mutate(
                    { projectId: project.id, archived: true },
                    {
                      onSuccess: () =>
                        toast({ title: `"${project.name}" diarsipkan`, tone: "info" }),
                    },
                  ),
              },
              {
                id: "delete",
                label: "Hapus",
                tone: "danger",
                icon: <Trash2 className="size-4" aria-hidden />,
                onSelect: () => setConfirmOpen(true),
              },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-title text-2xl leading-tight text-foreground">
            <Link
              href={`/projects/${project.id}`}
              className="rounded after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-500 focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-canvas"
            >
              {project.name}
            </Link>
          </h3>
          {complete ? <Badge tone="success">Selesai</Badge> : null}
        </div>

        {project.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{project.description}</p>
        ) : null}

        <div className="mt-4 space-y-1.5">
          <Progress value={done} max={total || 1} label={`Progres ${project.name}`} />
          <p className="text-xs text-muted">
            <span className="font-medium text-foreground tabular-nums">{done}</span>/{total} task
            diselesaikan
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {members.data && members.data.length > 0 ? (
              <AvatarStack
                people={members.data.map((member) => ({
                  id: member.userId,
                  name: member.name,
                  avatarColor: member.avatarColor,
                }))}
                max={4}
              />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Users className="size-3.5" aria-hidden />
                {project.memberCount} anggota
              </span>
            )}
          </div>
          <span className="text-xs text-muted">{relativeTime(project.updatedAt)}</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          remove.mutate(project.id, {
            onSuccess: () => {
              setConfirmOpen(false);
              toast({ title: `"${project.name}" dihapus`, tone: "success" });
            },
            onError: () => toast({ title: "Gagal menghapus project", tone: "error" }),
          });
        }}
        title={`Hapus "${project.name}"?`}
        description="Semua subject dan task di dalamnya akan ikut terhapus permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus permanen"
        loading={remove.isPending}
      />
    </article>
  );
}
