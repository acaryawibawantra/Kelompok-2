"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectGrid } from "@/components/project/project-grid";
import { DashboardSummary } from "@/components/dashboard/summary-panel";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useProjects } from "@/lib/queries";
import { useUiStore } from "@/lib/stores/ui-store";
import type { ProjectScope } from "@/types";

export default function MySpacePage() {
  const [scope, setScope] = useState<ProjectScope>("all");
  const setNewProjectOpen = useUiStore((state) => state.setNewProjectOpen);

  const all = useProjects("all", false);
  const favorites = useProjects("favorites", false);
  const recent = useProjects("recent", false);

  const dataByScope: Record<ProjectScope, typeof all.data> = {
    all: all.data,
    favorites: favorites.data,
    recent: recent.data,
  };

  const isLoading =
    scope === "all" ? all.isLoading : scope === "favorites" ? favorites.isLoading : recent.isLoading;

  const counts = {
    all: all.data?.length ?? 0,
    favorites: favorites.data?.length ?? 0,
    recent: recent.data?.length ?? 0,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Root Canvas"
        title="My Space"
        description="Semua project, favorit, dan yang terakhir kamu buka ada di sini."
        actions={
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New Project
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Daftar project" className="min-w-0">
          <Segmented<ProjectScope>
            ariaLabel="Saring project"
            value={scope}
            onChange={setScope}
            options={[
              { value: "all", label: "All Boards", count: counts.all },
              { value: "favorites", label: "Favorites", count: counts.favorites },
              { value: "recent", label: "Recent", count: counts.recent },
            ]}
          />
          <div className="mt-4">
            <ProjectGrid
              projects={dataByScope[scope] ?? []}
              isLoading={isLoading}
              scope={scope}
            />
          </div>
        </section>

        <aside aria-label="Ringkasan harian">
          <DashboardSummary />
        </aside>
      </div>
    </div>
  );
}
