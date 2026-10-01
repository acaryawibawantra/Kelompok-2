"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useJoinInvite } from "@/lib/queries";

export function InviteJoinCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const joinInvite = useJoinInvite();
  const router = useRouter();
  const { toast } = useToast();

  if (!token) return null;

  return (
    <section className="flex flex-col gap-3 rounded-card border border-brand-300 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-950/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
          <Link2 className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-foreground">Kamu menerima tautan undangan</p>
          <p className="text-sm text-muted">Gabung project ini untuk mulai berkolaborasi.</p>
        </div>
      </div>
      <Button
        loading={joinInvite.isPending}
        onClick={() =>
          joinInvite.mutate(token, {
            onSuccess: ({ projectId }) => {
              toast({ title: "Berhasil bergabung", tone: "success" });
              router.push(`/projects/${projectId}`);
            },
            onError: (error) =>
              toast({
                title: "Gagal bergabung",
                description: error instanceof Error ? error.message : undefined,
                tone: "error",
              }),
          })
        }
      >
        Gabung project
      </Button>
    </section>
  );
}
