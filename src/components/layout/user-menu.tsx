"use client";

import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActionMenu } from "@/components/ui/action-menu";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { useLogout, useMe } from "@/lib/queries";

export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const { toast } = useToast();

  if (!user) return null;

  return (
    <ActionMenu
      label="Menu profil"
      align="end"
      trigger={<Avatar name={user.name} color={user.avatarColor} size="md" />}
      triggerClassName="size-9 rounded-full"
      items={[
        {
          id: "settings",
          label: "Pengaturan",
          icon: <SettingsIcon className="size-4" aria-hidden />,
          onSelect: () => router.push("/settings"),
        },
        {
          id: "logout",
          label: "Keluar",
          tone: "danger",
          icon: <LogOut className="size-4" aria-hidden />,
          onSelect: () => {
            void logout.mutateAsync().then(() => {
              toast({ title: "Kamu telah keluar", tone: "info" });
              router.replace("/login");
            });
          },
        },
      ]}
    />
  );
}
