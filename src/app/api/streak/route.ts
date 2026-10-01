import { handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { getStreak } from "@/server/services/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    return json(await getStreak(user));
  } catch (error) {
    return handleError(error);
  }
}
