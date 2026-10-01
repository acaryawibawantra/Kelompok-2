import { tasksQuerySchema } from "@/lib/schemas";
import { ApiError } from "@/lib/api/errors";
import { handleError, json, parseQuery } from "@/server/http";
import { requireUser } from "@/server/session";
import { listArchivedTasks, listDueTodayTasks } from "@/server/services/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const query = parseQuery(request, tasksQuerySchema);
    if (query.archived) return json(await listArchivedTasks(user));
    if (query.due === "today") return json(await listDueTodayTasks(user));
    throw new ApiError("VALIDATION_ERROR", "Sertakan parameter archived=true atau due=today.");
  } catch (error) {
    return handleError(error);
  }
}
