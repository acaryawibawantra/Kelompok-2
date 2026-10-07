import { createAttendanceShareSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createAttendanceShare } from "@/server/services/attendance-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, createAttendanceShareSchema);
    return json(await createAttendanceShare(user, input.weekStart));
  } catch (error) {
    return handleError(error);
  }
}
