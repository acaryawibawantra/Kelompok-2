import type { ProjectScope } from "@/types";

export const queryKeys = {
  me: ["me"] as const,
  streak: ["streak"] as const,
  invites: ["invites"] as const,
  archivedTasks: ["tasks", "archived"] as const,
  dueToday: ["tasks", "due-today"] as const,
  scheduledTasks: ["tasks", "scheduled"] as const,
  projects: (scope: ProjectScope, archived: boolean) => ["projects", scope, archived] as const,
  project: (id: string) => ["project", id] as const,
};
