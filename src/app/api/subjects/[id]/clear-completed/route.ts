import { broadcast } from "@/server/realtime";
import { assertSameOrigin, handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { clearCompleted } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const result = await clearCompleted(user, id);
    await broadcast(result.projectId, { t: "member.changed" });
    return json({ deleted: result.deleted });
  } catch (error) {
    return handleError(error);
  }
}
