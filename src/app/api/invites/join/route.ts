import { joinInviteSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { joinInvite } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, joinInviteSchema);
    return json(await joinInvite(user, input.token));
  } catch (error) {
    return handleError(error);
  }
}
