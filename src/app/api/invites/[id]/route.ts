import { assertSameOrigin, handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { revokeInvite } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    await revokeInvite(user, id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
