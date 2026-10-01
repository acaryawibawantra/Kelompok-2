import { updateMeSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { updateMe } from "@/server/services/auth-service";

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, updateMeSchema);
    const updated = await updateMe(user.id, input);
    return json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = "force-dynamic";
