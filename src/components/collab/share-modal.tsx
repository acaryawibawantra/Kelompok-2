"use client";

import { useState } from "react";
import { Copy, Link2, Mail, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { MemberList } from "./member-list";
import { useCreateInvite, useProjectInvites, useRevokeInvite } from "@/lib/queries";
import { createInviteSchema } from "@/lib/schemas";
import type { Member, Role } from "@/types";

export interface ShareModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string | undefined;
  isOwner: boolean;
}

export function ShareModal({
  projectId,
  open,
  onClose,
  members,
  currentUserId,
  isOwner,
}: ShareModalProps) {
  const invites = useProjectInvites(open ? projectId : "");
  const createInvite = useCreateInvite(projectId);
  const revokeInvite = useRevokeInvite(projectId);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("editor");

  function inviteLink(token: string): string {
    if (typeof window === "undefined") return token;
    return `${window.location.origin}/invites?token=${token}`;
  }

  function copyLink(token: string) {
    void navigator.clipboard
      .writeText(inviteLink(token))
      .then(() => toast({ title: "Tautan undangan disalin", tone: "success" }))
      .catch(() => toast({ title: "Gagal menyalin tautan", tone: "error" }));
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Bagikan Project"
      description="Undang anggota dan atur peran mereka."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Anggota ({members.length})
          </h3>
          <MemberList
            projectId={projectId}
            members={members}
            currentUserId={currentUserId}
            canManage={isOwner}
          />
        </section>

        {isOwner ? (
          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Undang via email</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <Label htmlFor="invite-email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <select
                aria-label="Peran undangan"
                value={role}
                onChange={(event) => setRole(event.target.value as Exclude<Role, "owner">)}
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm focus-visible:border-brand-400"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                loading={createInvite.isPending}
                onClick={() => {
                  const parsed = createInviteSchema.safeParse({
                    email: email.trim() ? email.trim() : null,
                    role,
                  });
                  if (!parsed.success) {
                    toast({ title: "Email tidak valid", tone: "error" });
                    return;
                  }
                  createInvite.mutate(parsed.data, {
                    onSuccess: (invite) => {
                      setEmail("");
                      toast({ title: `Undangan dikirim ke ${invite.email ?? "tautan"}`, tone: "success" });
                    },
                    onError: (error) =>
                      toast({
                        title: "Gagal mengundang",
                        description: error instanceof Error ? error.message : undefined,
                        tone: "error",
                      }),
                  });
                }}
              >
                <Mail className="size-4" aria-hidden />
                Undang
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                createInvite.mutate(
                  { email: null, role: "viewer" },
                  {
                    onSuccess: (invite) => copyLink(invite.token),
                    onError: () => toast({ title: "Gagal membuat tautan", tone: "error" }),
                  },
                )
              }
            >
              <Link2 className="size-4" aria-hidden />
              Buat & salin tautan undangan
            </Button>
          </section>
        ) : null}

        {(invites.data?.length ?? 0) > 0 ? (
          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Undangan menunggu</h3>
            <ul className="space-y-2">
              {invites.data?.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {invite.email ?? "Tautan undangan"}
                    </p>
                    <p className="text-xs capitalize text-muted">{invite.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Salin tautan"
                    onClick={() => copyLink(invite.token)}
                  >
                    <Copy className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Cabut undangan"
                    className="text-danger hover:bg-danger-soft dark:hover:bg-rose-900/30"
                    onClick={() =>
                      revokeInvite.mutate(invite.id, {
                        onSuccess: () => toast({ title: "Undangan dicabut", tone: "info" }),
                      })
                    }
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Drawer>
  );
}
