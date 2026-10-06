"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateClassScheduleInput, UpdateClassScheduleInput } from "@/types";
import { queryKeys } from "./keys";

export function useSchedules() {
  return useQuery({
    queryKey: queryKeys.schedules,
    queryFn: () => api.schedules.list(),
    staleTime: 15_000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassScheduleInput) => api.schedules.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
}

// Impor massal hasil OCR.
export function useCreateSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateClassScheduleInput[]) => api.schedules.createMany(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClassScheduleInput }) =>
      api.schedules.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.schedules.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
}
