import { joinInviteSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { broadcast } from "@/server/realtime";
import { requireUser } from "@/server/session";
import { joinInvite } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, joinInviteSchema);
    const result = await joinInvite(user, input.token);
    await broadcast(result.projectId, { t: "member.changed" });
    return json(result);
  } catch (error) {
    return handleError(error);
  }
}
