"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Member } from "@/types";

export function PresenceStack({
  members,
  max = 5,
  className,
}: {
  members: Member[];
  max?: number;
  className?: string;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  const onlineCount = members.filter((member) => member.online).length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center -space-x-2">
        {visible.map((member) => (
          <span key={member.userId} className="relative">
            <Avatar name={member.name} color={member.avatarColor} size="sm" />
            {member.online ? (
              <span
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-emerald-500"
              />
            ) : null}
          </span>
        ))}
        {overflow > 0 ? (
          <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-[11px] text-muted ring-2 ring-surface">
            +{overflow}
          </span>
        ) : null}
      </div>
      {onlineCount > 0 ? (
        <span className="hidden text-xs text-muted sm:inline">{onlineCount} online</span>
      ) : null}
    </div>
  );
}
