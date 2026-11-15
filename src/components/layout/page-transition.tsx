"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Remounts content per route so the `page-enter` CSS animation replays. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
