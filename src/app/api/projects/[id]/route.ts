import { updateProjectSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import {
  deleteProject,
  getProjectDetail,
  updateProject,
} from "@/server/services/project-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return json(await getProjectDetail(user, id));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, updateProjectSchema);
    return json(await updateProject(user, id, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    await deleteProject(user, id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
