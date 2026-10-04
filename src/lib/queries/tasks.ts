"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "./keys";

export function useScheduledTasks() {
  return useQuery({
    queryKey: queryKeys.scheduledTasks,
    queryFn: () => api.tasks.listScheduled(),
    staleTime: 15_000,
  });
}
