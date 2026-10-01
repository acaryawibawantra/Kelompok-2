import { assertSameOrigin, handleError, json } from "@/server/http";
import { clearSessionCookie } from "@/server/jwt";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = "force-dynamic";
