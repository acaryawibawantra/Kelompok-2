import { handleError, json } from "@/server/http";
import { getPublicRecap } from "@/server/services/attendance-service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  try {
    const { token } = await context.params;
    return json(await getPublicRecap(token));
  } catch (error) {
    return handleError(error);
  }
}
