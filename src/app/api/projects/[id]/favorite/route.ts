import { favoriteInputSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { setProjectFavorite } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, favoriteInputSchema);
    return json(await setProjectFavorite(user, id, input.value));
  } catch (error) {
    return handleError(error);
  }
}
