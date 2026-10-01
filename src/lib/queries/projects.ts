"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateProjectInput,
  Project,
  ProjectScope,
  UpdateProjectInput,
} from "@/types";
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

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => api.projects.update(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.projects.remove(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSetProjectArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, archived }: { projectId: string; archived: boolean }) =>
      api.projects.setArchived(projectId, archived),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSetProjectFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, value }: { projectId: string; value: boolean }) =>
      api.projects.setFavorite(projectId, value),
    onMutate: async ({ projectId, value }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const snapshots = queryClient.getQueriesData<Project[]>({ queryKey: ["projects"] });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData(
          key,
          data.map((project) =>
            project.id === projectId ? { ...project, isFavorite: value } : project,
          ),
        );
      }
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
