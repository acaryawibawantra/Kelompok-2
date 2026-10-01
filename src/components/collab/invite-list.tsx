"use client";

import { Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAcceptInvite, useDeclineInvite, useInvites } from "@/lib/queries";

export function InviteList() {
  const { data, isLoading } = useInvites();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if ((data?.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={<Mail className="size-6" aria-hidden />}
        title="Tidak ada undangan"
        description="Undangan project yang ditujukan untukmu akan muncul di sini."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data?.map((invite) => (
        <li
          key={invite.id}
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-foreground">{invite.projectName}</p>
            <p className="text-sm text-muted">
              Kamu diundang sebagai <span className="capitalize">{invite.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              loading={decline.isPending}
              onClick={() =>
                decline.mutate(invite.id, {
                  onSuccess: () => toast({ title: "Undangan ditolak", tone: "info" }),
                })
              }
            >
              <X className="size-4" aria-hidden />
              Tolak
            </Button>
            <Button
              loading={accept.isPending}
              onClick={() =>
                accept.mutate(invite.id, {
                  onSuccess: () => toast({ title: "Undangan diterima", tone: "success" }),
                })
              }
            >
              <Check className="size-4" aria-hidden />
              Terima
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
