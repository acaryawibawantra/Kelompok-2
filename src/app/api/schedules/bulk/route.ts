import { bulkCreateClassSchedulesSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createSchedulesBulk } from "@/server/services/schedule-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, bulkCreateClassSchedulesSchema);
    return json(await createSchedulesBulk(user, input.items));
  } catch (error) {
    return handleError(error);
  }
}
