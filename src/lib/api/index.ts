import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { TaskCanvasApi } from "./types";

export const apiMode = process.env.NEXT_PUBLIC_API_MODE === "mock" ? "mock" : "http";

export const api: TaskCanvasApi = apiMode === "mock" ? mockApi : httpApi;

export { ApiError, isApiError } from "./errors";
export type { TaskCanvasApi, ProjectDetail, TaskMutationResult } from "./types";
export type { ArchivedTask, DueTask } from "@/types";
