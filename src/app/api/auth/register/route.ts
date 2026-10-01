import { getDb } from "@/db/client";
import { registerSchema } from "@/lib/schemas";
import { getEnv } from "@/server/env";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { signSession, sessionCookie } from "@/server/jwt";
import { clientKey, enforceRateLimit } from "@/server/rate-limit";
import { registerUser } from "@/server/services/auth-service";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const db = getDb();
    await enforceRateLimit(db, clientKey(request, "register"), 5, 60_000);
    const input = await parseJson(request, registerSchema);
    const user = await registerUser(input);
    const token = await signSession(user.id, getEnv().JWT_SECRET);
    return json(user, { headers: { "Set-Cookie": sessionCookie(token) } });
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = "force-dynamic";
