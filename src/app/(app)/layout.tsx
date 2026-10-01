import type { ReactNode } from "react";
import { RequireAuth } from "@/components/layout/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { NewProjectModal } from "@/components/project/new-project-modal";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
      <NewProjectModal />
    </RequireAuth>
  );
}
