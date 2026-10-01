import { createSubjectSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createSubject } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, createSubjectSchema);
    return json(await createSubject(user, id, input), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
