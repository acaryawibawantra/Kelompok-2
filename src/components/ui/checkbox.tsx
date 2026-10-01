"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  id?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  label,
  id,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border bg-surface hover:border-brand-400",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="grid place-items-center"
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </motion.span>
    </button>
  );
}
