import { handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { listMembers } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return json(await listMembers(user, id));
  } catch (error) {
    return handleError(error);
  }
}
