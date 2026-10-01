import { cn } from "@/lib/utils";

export interface GoalRingProps {
  value: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function GoalRing({
  value,
  goal,
  size = 132,
  strokeWidth = 11,
  className,
  label = "Target harian",
}: GoalRingProps) {
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.min(1, value / safeGoal);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * pct;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      role="img"
      aria-label={`${label}: ${value} dari ${goal} task`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
          <span className="text-base text-muted">/{goal}</span>
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">task</span>
      </div>
    </div>
  );
}
