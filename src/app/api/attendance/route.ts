import { z } from "zod";
import { dueDateSchema, createAttendanceSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson, parseQuery } from "@/server/http";
import { requireUser } from "@/server/session";
import { checkInAttendance, listAttendance } from "@/server/services/attendance-service";

export const dynamic = "force-dynamic";

const rangeQuerySchema = z.object({
  from: dueDateSchema.optional(),
  to: dueDateSchema.optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const range = parseQuery(request, rangeQuerySchema);
    return json(await listAttendance(user, range));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, createAttendanceSchema);
    return json(await checkInAttendance(user, input));
  } catch (error) {
    return handleError(error);
  }
}
