import { updateAttendanceSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { deleteAttendance, updateAttendance } from "@/server/services/attendance-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const input = await parseJson(request, updateAttendanceSchema);
    return json(await updateAttendance(user, id, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    await deleteAttendance(user, id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
