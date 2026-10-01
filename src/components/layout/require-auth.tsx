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
      const target = `${window.location.pathname}${window.location.search}`;
      const search = target && target !== "/" ? `?redirect=${encodeURIComponent(target)}` : "";
      router.replace(`/login${search}`);
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
