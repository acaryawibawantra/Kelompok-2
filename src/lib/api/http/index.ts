import { ApiError, type ApiErrorCode } from "../errors";
import type { TaskCanvasApi, TaskMutationResult, ProjectDetail } from "../types";
import type {
  ArchivedTask,
  CreateInviteInput,
  CreateProjectInput,
  CreateSubjectInput,
  CreateTaskInput,
  DueTask,
  Invite,
  LoginInput,
  Member,
  Project,
  RegisterInput,
  ScheduledTask,
  StreakSummary,
  Subject,
  Task,
  UpdateMeInput,
  UpdateMemberRoleInput,
  UpdateProjectInput,
  UpdateSubjectInput,
  UpdateTaskInput,
  User,
} from "@/types";

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  500: "INTERNAL",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const error = (
      body as { error?: { code?: string; message?: string; fields?: Record<string, string> } }
    )?.error;
    const code =
      (error?.code as ApiErrorCode | undefined) ?? STATUS_TO_CODE[response.status] ?? "INTERNAL";
    throw new ApiError(code, error?.message ?? "Terjadi kesalahan pada server.", error?.fields);
  }

  return (body as { data: T }).data;
}

function body(value: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(value) };
}

export const httpApi: TaskCanvasApi = {
  auth: {
    register: (input: RegisterInput) => request<User>("/auth/register", body(input)),
    login: (input: LoginInput) => request<User>("/auth/login", body(input)),
    logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }).then(() => undefined),
    me: async () => {
      try {
        return await request<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.code === "UNAUTHORIZED") return null;
        throw error;
      }
    },
    updateMe: (input: UpdateMeInput) =>
      request<User>("/me", { method: "PATCH", body: JSON.stringify(input) }),
  },
  projects: {
    list: (params) => {
      const search = new URLSearchParams();
      if (params?.scope) search.set("scope", params.scope);
      if (params?.archived) search.set("archived", "true");
      const query = search.toString();
      return request<Project[]>(`/projects${query ? `?${query}` : ""}`);
    },
    create: (input: CreateProjectInput) => request<Project>("/projects", body(input)),
    get: (id) => request<ProjectDetail>(`/projects/${id}`),
    update: (id, input: UpdateProjectInput) =>
      request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    remove: (id) =>
      request<{ ok: true }>(`/projects/${id}`, { method: "DELETE" }).then(() => undefined),
    setArchived: (id, archived) =>
      request<Project>(`/projects/${id}/${archived ? "archive" : "unarchive"}`, { method: "POST" }),
    setFavorite: (id, value) => request<Project>(`/projects/${id}/favorite`, body({ value })),
  },
  subjects: {
    create: (projectId, input: CreateSubjectInput) =>
      request<Subject>(`/projects/${projectId}/subjects`, body(input)),
    update: (id, input: UpdateSubjectInput) =>
      request<Subject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    remove: (id) =>
      request<{ ok: true }>(`/subjects/${id}`, { method: "DELETE" }).then(() => undefined),
    clearCompleted: (id) =>
      request<{ deleted: number }>(`/subjects/${id}/clear-completed`, { method: "POST" }),
  },
  tasks: {
    create: (subjectId, input: CreateTaskInput) =>
      request<Task>(`/subjects/${subjectId}/tasks`, body(input)),
    update: (id, input: UpdateTaskInput) =>
      request<TaskMutationResult>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id) =>
      request<{ ok: true }>(`/tasks/${id}`, { method: "DELETE" }).then(() => undefined),
    listArchived: () => request<ArchivedTask[]>("/tasks?archived=true"),
    listDueToday: () => request<DueTask[]>("/tasks?due=today"),
    listScheduled: () => request<ScheduledTask[]>("/tasks?due=scheduled"),
  },
  members: {
    list: (projectId) => request<Member[]>(`/projects/${projectId}/members`),
    updateRole: (projectId, userId, input: UpdateMemberRoleInput) =>
      request<Member>(`/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (projectId, userId) =>
      request<{ ok: true }>(`/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      }).then(() => undefined),
  },
  invites: {
    list: () => request<Invite[]>("/invites"),
    listForProject: (projectId) => request<Invite[]>(`/projects/${projectId}/invites`),
    create: (projectId, input: CreateInviteInput) =>
      request<Invite>(`/projects/${projectId}/invites`, body(input)),
    revoke: (id) =>
      request<{ ok: true }>(`/invites/${id}`, { method: "DELETE" }).then(() => undefined),
    accept: (id) =>
      request<{ projectId: string }>(`/invites/${id}/accept`, { method: "POST" }).then(
        () => undefined,
      ),
    decline: (id) =>
      request<{ ok: true }>(`/invites/${id}/decline`, { method: "POST" }).then(() => undefined),
    join: (token) => request<{ projectId: string }>("/invites/join", body({ token })),
  },
  streak: {
    get: () => request<StreakSummary>("/streak"),
  },
};
