import { updateSubjectSchema } from "@/lib/schemas";
import { broadcast } from "@/server/realtime";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { deleteSubject, updateSubject } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, updateSubjectSchema);
    const subject = await updateSubject(user, id, input);
    await broadcast(subject.projectId, { t: "subject.updated", subject });
    return json(subject);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const { projectId } = await deleteSubject(user, id);
    await broadcast(projectId, { t: "subject.deleted", subjectId: id });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
