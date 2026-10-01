import { createInviteSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createInvite, listProjectInvites } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return json(await listProjectInvites(user, id));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, createInviteSchema);
    return json(await createInvite(user, id, input), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
