"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateProjectInput, ProjectScope } from "@/types";
import { queryKeys } from "./keys";

export function useProjects(scope: ProjectScope = "all", archived = false) {
  return useQuery({
    queryKey: queryKeys.projects(scope, archived),
    queryFn: () => api.projects.list({ scope, archived }),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => api.projects.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
