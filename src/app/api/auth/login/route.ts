import { getDb } from "@/db/client";
import { loginSchema } from "@/lib/schemas";
import { getEnv } from "@/server/env";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { signSession, sessionCookie } from "@/server/jwt";
import { clientKey, enforceRateLimit } from "@/server/rate-limit";
import { loginUser } from "@/server/services/auth-service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const db = getDb();
    await enforceRateLimit(db, clientKey(request, "login"), 10, 60_000);
    const input = await parseJson(request, loginSchema);
    const user = await loginUser(input);
    const token = await signSession(user.id, getEnv().JWT_SECRET);
    return json(user, { headers: { "Set-Cookie": sessionCookie(token) } });
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = "force-dynamic";
