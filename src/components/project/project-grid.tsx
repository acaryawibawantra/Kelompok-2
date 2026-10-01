"use client";

import { FolderPlus, Plus, Star } from "lucide-react";
import { ProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useUiStore } from "@/lib/stores/ui-store";
import type { Project, ProjectScope } from "@/types";

export interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  scope: ProjectScope;
}

export function ProjectGrid({ projects, isLoading, scope }: ProjectGridProps) {
  const setNewProjectOpen = useUiStore((state) => state.setNewProjectOpen);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (projects.length === 0) {
    if (scope === "favorites") {
      return (
        <EmptyState
          icon={<Star className="size-6" aria-hidden />}
          title="Belum ada favorit"
          description="Tandai project dengan bintang agar mudah ditemukan di sini."
        />
      );
    }
    return (
      <EmptyState
        icon={<FolderPlus className="size-6" aria-hidden />}
        title="Buat project pertamamu"
        description="Mulai dengan satu project, lalu pecah menjadi subject dan task."
        action={
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New Project
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
