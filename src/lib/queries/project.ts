"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ProjectDetail } from "@/lib/api";
import type {
  CreateSubjectInput,
  CreateTaskInput,
  UpdateMemberRoleInput,
  UpdateSubjectInput,
  UpdateTaskInput,
} from "@/types";
import { queryKeys } from "./keys";

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.projects.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => api.subjects.create(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      api.subjects.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useDeleteSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.subjects.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useClearCompleted(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) => api.subjects.clearCompleted(subjectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, input }: { subjectId: string; input: CreateTaskInput }) =>
      api.tasks.create(subjectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.project(projectId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.tasks.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProjectDetail>(key);
      if (previous) {
        queryClient.setQueryData<ProjectDetail>(key, {
          ...previous,
          tasks: previous.tasks.map((task) => (task.id === id ? { ...task, ...input } : task)),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.streak, result.streak);
      if (result.task.projectId !== projectId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project(result.task.projectId) });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateMemberRoleInput }) =>
      api.members.updateRole(projectId, userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.members.remove(projectId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
