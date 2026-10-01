import { getDb } from "@/db/client";
import { handleError, json } from "@/server/http";
import { signRealtimeToken } from "@/server/jwt";
import { requireMember } from "@/server/authz";
import { getEnv } from "@/server/env";
import { requireUser } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    await requireMember(getDb(), id, user.id);
    const token = await signRealtimeToken(
      {
        userId: user.id,
        projectId: id,
        name: user.name,
        avatarColor: user.avatarColor,
      },
      getEnv().JWT_SECRET,
    );
    return json({ token, url: getEnv().REALTIME_WS_URL });
  } catch (error) {
    return handleError(error);
  }
}
