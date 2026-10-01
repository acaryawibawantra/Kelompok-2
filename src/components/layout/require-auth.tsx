"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/queries";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { FullPageLoader } from "./full-page-loader";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      useSettingsStore.getState().hydrateFromUser(user.settings);
    }
  }, [user]);

  if (isLoading) return <FullPageLoader />;
  if (!user) return <FullPageLoader />;
  return <>{children}</>;
}
