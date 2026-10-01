"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock, Share2 } from "lucide-react";
import { Board } from "@/components/board/board";
import { ShareModal } from "@/components/collab/share-modal";
import { ProjectHeader, ProjectHeaderSkeleton } from "@/components/project/project-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonClass } from "@/components/ui/button";
import { useProject } from "@/lib/queries";
import { useProjectRole } from "@/components/board/use-project-role";
import { useMe } from "@/lib/queries";
import { useProjectRealtime } from "@/lib/realtime";
import { useUiStore } from "@/lib/stores/ui-store";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { data, isLoading, isError } = useProject(projectId);
  const { data: user } = useMe();
  const { canEdit, isOwner } = useProjectRole(data?.members);
  const view = useUiStore((state) => state.boardView);
  const setBoardView = useUiStore((state) => state.setBoardView);
  const [shareOpen, setShareOpen] = useState(false);
  const { presence } = useProjectRealtime(projectId);
  const onlineIds = new Set(presence.map((entry) => entry.userId));

  const timezone = user?.timezone ?? "Asia/Jakarta";

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ProjectHeaderSkeleton />
        <div className="flex gap-4 overflow-hidden">
          <Skeleton className="h-72 w-[300px] rounded-card" />
          <Skeleton className="h-72 w-[300px] rounded-card" />
          <Skeleton className="h-72 w-[300px] rounded-card" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<Lock className="size-6" aria-hidden />}
          title="Project tidak ditemukan"
          description="Project ini mungkin sudah dihapus, atau kamu bukan anggotanya."
          action={
            <Link href="/" className={buttonClass("primary", "md")}>
              <ArrowLeft className="size-4" aria-hidden />
              Kembali ke My Space
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <ProjectHeader
        className="px-4 sm:px-6"
        project={data.project}
        members={data.members}
        onlineIds={onlineIds}
        view={view}
        onViewChange={setBoardView}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" aria-hidden />
            Bagikan
          </Button>
        }
      />
      <div className="min-h-0 flex-1">
        <Board
          detail={data}
          projectId={projectId}
          timezone={timezone}
          canEdit={canEdit}
          view={view}
        />
      </div>

      <ShareModal
        projectId={projectId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        members={data.members}
        currentUserId={user?.id}
        isOwner={isOwner}
      />
    </div>
  );
}
