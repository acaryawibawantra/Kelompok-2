"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@/types";
import { queryKeys } from "./keys";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.auth.me(),
    staleTime: 30_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.auth.login(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      useSettingsStore.getState().hydrateFromUser(user.settings);
      void queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.auth.register(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      useSettingsStore.getState().hydrateFromUser(user.settings);
      void queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.clear();
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => api.auth.updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      useSettingsStore.getState().hydrateFromUser(user.settings);
      void queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
