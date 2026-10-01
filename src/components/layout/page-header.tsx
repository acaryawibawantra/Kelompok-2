import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-title text-4xl leading-[1.05] text-foreground sm:text-5xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
