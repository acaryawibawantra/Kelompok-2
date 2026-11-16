import { handleError, json, parseQuery } from "@/server/http";
import { requireUser } from "@/server/session";
import { getAttendanceSummary } from "@/server/services/attendance-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const summaryQuerySchema = z.object({
  /** Tanggal acuan minggu yang dilihat (YYYY-MM-DD); kosong = minggu berjalan. */
  week: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { week } = parseQuery(request, summaryQuerySchema);
    return json(await getAttendanceSummary(user, week));
  } catch (error) {
    return handleError(error);
  }
}
