import { assertSameOrigin, handleError, json } from "@/server/http";
import { broadcast } from "@/server/realtime";
import { requireUser } from "@/server/session";
import { acceptInvite } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const result = await acceptInvite(user, id);
    await broadcast(result.projectId, { t: "member.changed" });
    return json(result);
  } catch (error) {
    return handleError(error);
  }
}
