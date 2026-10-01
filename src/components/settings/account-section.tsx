"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLogout, useMe, useUpdateMe } from "@/lib/queries";

export function AccountSection() {
  const { data: user } = useMe();
  const updateMe = useUpdateMe();
  const logout = useLogout();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-name">Nama</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="max-w-xs"
            maxLength={80}
          />
          <Button
            variant="secondary"
            loading={updateMe.isPending}
            onClick={() =>
              updateMe.mutate(
                { name: name.trim() },
                {
                  onSuccess: () => toast({ title: "Nama diperbarui", tone: "success" }),
                  onError: () => toast({ title: "Gagal memperbarui nama", tone: "error" }),
                },
              )
            }
          >
            Simpan
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" value={user?.email ?? ""} disabled className="max-w-xs" />
      </div>

      <div className="border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => {
            void logout.mutateAsync().then(() => router.replace("/login"));
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Keluar
        </Button>
      </div>
    </div>
  );
}
