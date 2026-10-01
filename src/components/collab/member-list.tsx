"use client";

import { UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useRemoveMember, useUpdateMemberRole } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Member, Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

export function MemberList({
  projectId,
  members,
  currentUserId,
  canManage,
}: {
  projectId: string;
  members: Member[];
  currentUserId: string | undefined;
  canManage: boolean;
}) {
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const { toast } = useToast();
  const [pendingRemove, setPendingRemove] = useState<Member | null>(null);

  return (
    <ul className="space-y-2">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const isOwner = member.role === "owner";
        return (
          <li
            key={member.userId}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
          >
            <Avatar name={member.name} color={member.avatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {member.name}
                {isSelf ? <span className="ml-1 text-xs text-muted">(kamu)</span> : null}
              </p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>

            {canManage && !isOwner ? (
              <select
                aria-label={`Peran ${member.name}`}
                value={member.role}
                onChange={(event) =>
                  updateRole.mutate(
                    { userId: member.userId, input: { role: event.target.value as Role } },
                    { onSuccess: () => toast({ title: "Peran diperbarui", tone: "success" }) },
                  )
                }
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs focus-visible:border-brand-400"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            ) : (
              <Badge tone={isOwner ? "brand" : "neutral"}>{ROLE_LABEL[member.role]}</Badge>
            )}

            {!isOwner && (canManage || isSelf) ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={isSelf ? "Keluar dari project" : `Keluarkan ${member.name}`}
                className={cn(
                  "text-muted hover:text-danger",
                  "hover:bg-danger-soft dark:hover:bg-rose-900/30",
                )}
                onClick={() => setPendingRemove(member)}
              >
                <UserMinus className="size-4" aria-hidden />
              </Button>
            ) : null}
          </li>
        );
      })}

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          removeMember.mutate(pendingRemove.userId, {
            onSuccess: () => {
              toast({ title: "Anggota dikeluarkan", tone: "success" });
              setPendingRemove(null);
            },
          });
        }}
        title={
          pendingRemove?.userId === currentUserId
            ? "Keluar dari project?"
            : `Keluarkan ${pendingRemove?.name}?`
        }
        description="Akses anggota ini ke project akan dicabut."
        confirmLabel="Lanjutkan"
        loading={removeMember.isPending}
      />
    </ul>
  );
}
