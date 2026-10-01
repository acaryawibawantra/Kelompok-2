import { cn, initials } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  xs: "size-5 text-[9px]",
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
};

export interface AvatarProps {
  name: string;
  color?: string;
  size?: AvatarSize;
  className?: string;
  title?: string;
}

export function Avatar({ name, color = "#5b5ce2", size = "md", className, title }: AvatarProps) {
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-surface",
        sizeClass[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <span aria-hidden>{initials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

export interface AvatarStackProps {
  people: Array<{ id: string; name: string; avatarColor?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarStack({ people, max = 4, size = "sm", className }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((person) => (
        <Avatar
          key={person.id}
          name={person.name}
          color={person.avatarColor}
          size={size}
          className="transition-transform duration-150 hover:-translate-y-0.5"
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "inline-grid place-items-center rounded-full bg-surface-2 text-muted ring-2 ring-surface",
            sizeClass[size],
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
