"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateAttendanceInput, UpdateAttendanceInput } from "@/types";
import { queryKeys } from "./keys";

function invalidateAttendance(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
}

export function useAttendance(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [
      ...queryKeys.attendance,
      range?.from ?? null,
      range?.to ?? null,
    ] as const,
    queryFn: () => api.attendance.list(range),
    staleTime: 15_000,
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: queryKeys.attendanceSummary,
    queryFn: () => api.attendance.summary(),
    staleTime: 15_000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAttendanceInput) => api.attendance.checkIn(input),
    onSuccess: () => invalidateAttendance(queryClient),
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAttendanceInput }) =>
      api.attendance.update(id, input),
    onSuccess: () => invalidateAttendance(queryClient),
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.attendance.remove(id),
    onSuccess: () => invalidateAttendance(queryClient),
  });
}
