import { mockApi } from "./mock";
import type { TaskCanvasApi } from "./types";

export const apiMode = process.env.NEXT_PUBLIC_API_MODE === "http" ? "http" : "mock";

export const api: TaskCanvasApi = mockApi;

export { ApiError, isApiError } from "./errors";
export type {
  TaskCanvasApi,
  ProjectDetail,
  ArchivedTask,
  DueTask,
  TaskMutationResult,
} from "./types";
