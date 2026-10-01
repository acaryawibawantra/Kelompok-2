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
    return json(await clearCompleted(user, id));
  } catch (error) {
    return handleError(error);
  }
}
