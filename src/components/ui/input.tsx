import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Ties the field to a danger border + aria-invalid. */
  invalid?: boolean;
};

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-sm text-foreground",
        "transition-colors placeholder:text-muted/70 hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "max-sm:min-h-11",
        invalid && "border-danger hover:border-danger focus-visible:outline-danger",
        className,
      )}
      {...props}
    />
  );
}
