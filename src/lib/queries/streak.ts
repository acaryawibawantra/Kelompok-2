"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateInviteInput } from "@/types";
import { queryKeys } from "./keys";

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.streak,
    queryFn: () => api.streak.get(),
    staleTime: 15_000,
  });
}

export function useArchivedTasks() {
  return useQuery({
    queryKey: queryKeys.archivedTasks,
    queryFn: () => api.tasks.listArchived(),
  });
}

export function useDueToday() {
  return useQuery({
    queryKey: queryKeys.dueToday,
    queryFn: () => api.tasks.listDueToday(),
  });
}

export function useInvites() {
  return useQuery({
    queryKey: queryKeys.invites,
    queryFn: () => api.invites.list(),
  });
}

export function useProjectInvites(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.project(projectId), "invites"] as const,
    queryFn: () => api.invites.listForProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateInvite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInviteInput) => api.invites.create(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.project(projectId), "invites"],
      });
    },
  });
}

export function useRevokeInvite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.invites.revoke(inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.project(projectId), "invites"],
      });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.invites.accept(inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invites });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.invites.decline(inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invites });
    },
  });
}
