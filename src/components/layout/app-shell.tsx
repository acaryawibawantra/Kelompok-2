import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="canvas-grid min-h-[calc(100dvh-3.5rem)] flex-1">{children}</main>
      </div>
    </div>
  );
}
