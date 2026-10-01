import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 rounded-xl px-1 py-1", className)}
      aria-label="TaskCanvas — beranda"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
        <Sparkles className="size-4.5" aria-hidden />
      </span>
      {!collapsed ? (
        <span className="text-base font-semibold tracking-tight text-foreground">
          Task<span className="text-brand-600">Canvas</span>
        </span>
      ) : null}
    </Link>
  );
}
