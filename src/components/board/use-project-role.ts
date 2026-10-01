"use client";

import { useMe } from "@/lib/queries";
import type { Member, Role } from "@/types";

export interface ProjectRole {
  role: Role;
  canEdit: boolean;
  isOwner: boolean;
}

export function useProjectRole(members: Member[] | undefined): ProjectRole {
  const { data: user } = useMe();
  const member = members?.find((item) => item.userId === user?.id);
  const role: Role = member?.role ?? "viewer";
  return {
    role,
    canEdit: role === "owner" || role === "editor",
    isOwner: role === "owner",
  };
}
