import { updateMemberRoleSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { removeMember, updateMemberRole } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id, userId } = await context.params;
    const input = await parseJson(request, updateMemberRoleSchema);
    return json(await updateMemberRole(user, id, userId, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id, userId } = await context.params;
    await removeMember(user, id, userId);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
