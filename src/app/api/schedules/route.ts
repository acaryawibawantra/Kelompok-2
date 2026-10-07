import { createClassScheduleSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import {
  createSchedule,
  deleteAllSchedules,
  listSchedules,
} from "@/server/services/schedule-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    return json(await listSchedules(user));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, createClassScheduleSchema);
    return json(await createSchedule(user, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await deleteAllSchedules(user);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
