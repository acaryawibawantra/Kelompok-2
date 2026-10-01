import { handleError, json } from "@/server/http";
import { requireUser } from "@/server/session";
import { listInvitesForUser } from "@/server/services/collab-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    return json(await listInvitesForUser(user));
  } catch (error) {
    return handleError(error);
  }
}
