import { assertSameOrigin, handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { setProjectArchived } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    return json(await setProjectArchived(user, id, true));
  } catch (error) {
    return handleError(error);
  }
}
