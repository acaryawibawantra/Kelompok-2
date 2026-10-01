"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ArchivedProjects } from "@/components/archive/archived-projects";
import { ArchivedTasks } from "@/components/archive/archived-tasks";

export default function ArchivePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Ruang Arsip"
        title="Archive"
        description="Pulihkan atau hapus permanen item yang sudah kamu arsipkan."
      />
      <div className="mt-8 space-y-8">
        <ArchivedProjects />
        <ArchivedTasks />
      </div>
    </div>
  );
}
