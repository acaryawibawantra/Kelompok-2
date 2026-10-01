import { ApiError } from "@/lib/api/errors";
import { handleError, json } from "@/server/http";
import { getCurrentUser } from "@/server/session";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Kamu belum masuk.");
    }
    return json(user);
  } catch (error) {
    return handleError(error);
  }
}

export const dynamic = "force-dynamic";
