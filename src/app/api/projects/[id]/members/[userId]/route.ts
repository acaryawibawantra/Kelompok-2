import { updateMemberRoleSchema } from "@/lib/schemas";
import { broadcast } from "@/server/realtime";
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
    const member = await updateMemberRole(user, id, userId, input);
    await broadcast(id, { t: "member.changed" });
    return json(member);
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
    await broadcast(id, { t: "member.changed" });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
