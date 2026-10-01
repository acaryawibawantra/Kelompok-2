import { createTaskSchema } from "@/lib/schemas";
import { broadcast } from "@/server/realtime";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createTask } from "@/server/services/task-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, createTaskSchema);
    const task = await createTask(user, id, input);
    await broadcast(task.projectId, { t: "task.created", task });
    return json(task, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
