"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, type ProjectDetail } from "@/lib/api";
import type {
  CreateSubjectInput,
  CreateTaskInput,
  Member,
  Project,
  Role,
  UpdateMemberRoleInput,
  UpdateProjectInput,
  UpdateSubjectInput,
  UpdateTaskInput,
} from "@/types";
import { queryKeys } from "./keys";

function detailKey(projectId: string) {
  return queryKeys.project(projectId);
}

function getDetail(queryClient: QueryClient, projectId: string): ProjectDetail | undefined {
  return queryClient.getQueryData<ProjectDetail>(detailKey(projectId));
}

function setDetail(
  queryClient: QueryClient,
  projectId: string,
  updater: (detail: ProjectDetail) => ProjectDetail,
): void {
  queryClient.setQueryData<ProjectDetail>(detailKey(projectId), (previous) =>
    previous ? updater(previous) : previous,
  );
}

function statsOf(tasks: ProjectDetail["tasks"]): { total: number; done: number } {
  return { total: tasks.length, done: tasks.filter((task) => task.isDone).length };
}

function withStats(detail: ProjectDetail): ProjectDetail {
  return { ...detail, project: { ...detail.project, taskStats: statsOf(detail.tasks) } };
}

function patchProjectLists(
  queryClient: QueryClient,
  updater: (project: Project) => Project | null,
): void {
  queryClient.setQueriesData<Project[]>({ queryKey: ["projects"] }, (previous) => {
    if (!previous) return previous;
    return previous
      .map(updater)
      .filter((project): project is Project => project !== null);
  });
}

function patchProjectEverywhere(
  queryClient: QueryClient,
  projectId: string,
  updater: (project: Project) => Project,
): void {
  patchProjectLists(queryClient, (project) => (project.id === projectId ? updater(project) : project));
  setDetail(queryClient, projectId, (detail) => ({
    ...detail,
    project: detail.project.id === projectId ? updater(detail.project) : detail.project,
  }));
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.projects.get(id),
    enabled: Boolean(id),
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: [...queryKeys.project(projectId), "members"] as const,
    queryFn: () => api.members.list(projectId),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });
}

export function useCreateSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => api.subjects.create(projectId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      const tempId = `temp-subject-${Date.now()}`;
      if (previous) {
        const maxPosition = previous.subjects.reduce(
          (max, subject) => Math.max(max, subject.position),
          0,
        );
        setDetail(queryClient, projectId, (detail) => ({
          ...detail,
          subjects: [
            ...detail.subjects,
            {
              id: tempId,
              projectId,
              name: input.name,
              color: input.color ?? null,
              position: maxPosition + 1000,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      }
      return { previous, tempId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      api.subjects.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) => ({
        ...detail,
        subjects: detail.subjects.map((subject) =>
          subject.id === id ? { ...subject, ...input } : subject,
        ),
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
    },
  });
}

export function useDeleteSubject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.subjects.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) =>
        withStats({
          ...detail,
          subjects: detail.subjects.filter((subject) => subject.id !== id),
          tasks: detail.tasks.filter((task) => task.subjectId !== id),
        }),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useClearCompleted(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) => api.subjects.clearCompleted(subjectId),
    onMutate: async (subjectId) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) =>
        withStats({
          ...detail,
          tasks: detail.tasks.filter((task) => !(task.subjectId === subjectId && task.isDone)),
        }),
      );
      return { previous };
    },
    onError: (_error, _subjectId, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, input }: { subjectId: string; input: CreateTaskInput }) =>
      api.tasks.create(subjectId, input),
    onMutate: async ({ subjectId, input }) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      const tempId = `temp-task-${Date.now()}`;
      if (previous) {
        const maxPosition = previous.tasks
          .filter((task) => task.subjectId === subjectId)
          .reduce((max, task) => Math.max(max, task.position), 0);
        const now = new Date().toISOString();
        setDetail(queryClient, projectId, (detail) =>
          withStats({
            ...detail,
            tasks: [
              ...detail.tasks,
              {
                id: tempId,
                subjectId,
                projectId,
                title: input.title,
                notes: input.notes ?? null,
                isDone: false,
                completedAt: null,
                completedBy: null,
                assigneeId: input.assigneeId ?? null,
                dueDate: input.dueDate ?? null,
                priority: input.priority ?? null,
                isArchived: false,
                position: maxPosition + 1000,
                createdAt: now,
                updatedAt: now,
              },
            ],
          }),
        );
      }
      return { previous, tempId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSuccess: (task, _variables, context) => {
      if (!context) return;
      setDetail(queryClient, projectId, (detail) =>
        withStats({
          ...detail,
          tasks: detail.tasks.map((item) => (item.id === context.tempId ? task : item)),
        }),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  const key = detailKey(projectId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      api.tasks.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProjectDetail>(key);
      if (previous) {
        queryClient.setQueryData<ProjectDetail>(
          key,
          withStats({
            ...previous,
            tasks: previous.tasks.map((task) => (task.id === id ? { ...task, ...input } : task)),
          }),
        );
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
        void queryClient.invalidateQueries({ queryKey: detailKey(result.task.projectId) });
      }
      queryClient.setQueryData<ProjectDetail>(key, (previous) =>
        previous
          ? withStats({
              ...previous,
              tasks: previous.tasks.map((task) => (task.id === result.task.id ? result.task : task)),
            })
          : previous,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      void queryClient.invalidateQueries({ queryKey: queryKeys.archivedTasks });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) =>
        withStats({ ...detail, tasks: detail.tasks.filter((task) => task.id !== id) }),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.archivedTasks });
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => api.projects.update(projectId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const snapshots = queryClient.getQueriesData<Project[]>({ queryKey: ["projects"] });
      patchProjectEverywhere(queryClient, projectId, (project) => ({ ...project, ...input }));
      return { snapshots };
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) queryClient.setQueryData(key, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.projects.remove(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const snapshots = queryClient.getQueriesData<Project[]>({ queryKey: ["projects"] });
      patchProjectLists(queryClient, (project) => (project.id === projectId ? null : project));
      queryClient.removeQueries({ queryKey: detailKey(projectId) });
      return { snapshots };
    },
    onError: (_error, _projectId, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) queryClient.setQueryData(key, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSetProjectArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, archived }: { projectId: string; archived: boolean }) =>
      api.projects.setArchived(projectId, archived),
    onMutate: async ({ projectId, archived }) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const snapshots = queryClient.getQueriesData<Project[]>({ queryKey: ["projects"] });
      patchProjectEverywhere(queryClient, projectId, (project) => ({ ...project, isArchived: archived }));
      patchProjectLists(queryClient, (project) => (project.id === projectId ? null : project));
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) queryClient.setQueryData(key, data);
    },
    onSettled: () => {
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
      patchProjectEverywhere(queryClient, projectId, (project) => ({
        ...project,
        isFavorite: value,
      }));
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      for (const [key, data] of context.snapshots) queryClient.setQueryData(key, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateMemberRoleInput }) =>
      api.members.updateRole(projectId, userId, input),
    onMutate: async ({ userId, input }) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) => ({
        ...detail,
        members: detail.members.map((member) =>
          member.userId === userId ? { ...member, role: input.role as Role } : member,
        ),
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.members.remove(projectId, userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = getDetail(queryClient, projectId);
      setDetail(queryClient, projectId, (detail) => ({
        ...detail,
        members: detail.members.filter((member: Member) => member.userId !== userId),
        project: {
          ...detail.project,
          memberCount: Math.max(0, detail.project.memberCount - 1),
        },
      }));
      return { previous };
    },
    onError: (_error, _userId, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(projectId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
