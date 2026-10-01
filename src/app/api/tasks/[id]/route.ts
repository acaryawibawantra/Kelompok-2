import { updateTaskSchema } from "@/lib/schemas";
import { broadcast } from "@/server/realtime";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { removeTask, updateTask } from "@/server/services/task-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, updateTaskSchema);
    const result = await updateTask(user, id, input);
    await broadcast(result.task.projectId, { t: "task.updated", task: result.task });
    return json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const { projectId } = await removeTask(user, id);
    await broadcast(projectId, { t: "task.deleted", taskId: id });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
