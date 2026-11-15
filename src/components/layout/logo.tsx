import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark + monogram tile. Monogram uses the serif face so the brand reads
 * editorial ("notebook") instead of generic-tech icon-tile.
 */
export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 rounded-xl px-1 py-1", className)}
      aria-label="Semangat Brow — beranda"
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-brand-600 text-[15px] font-semibold italic leading-none text-white shadow-soft"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        sb
      </span>
      {!collapsed ? (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          Semangat <span className="text-brand-600">Brow</span>
        </span>
      ) : null}
    </Link>
  );
}
