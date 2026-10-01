"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InviteJoinCard } from "@/components/collab/invite-join-card";
import { InviteList } from "@/components/collab/invite-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvitesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Kolaborasi"
        title="Undangan"
        description="Terima atau tolak undangan project untukmu."
      />
      <div className="mt-8 space-y-6">
        <Suspense fallback={<Skeleton className="h-20 w-full rounded-card" />}>
          <InviteJoinCard />
        </Suspense>
        <InviteList />
      </div>
    </div>
  );
}
