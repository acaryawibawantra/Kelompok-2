import { ZodError, type ZodType } from "zod";
import { ApiError } from "@/lib/api/errors";
import { zodFieldErrors } from "@/lib/forms";

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}

export function handleError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message, fields: error.fields } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Data tidak valid.",
          fields: zodFieldErrors(error),
        },
      },
      { status: 400 },
    );
  }
  console.error("[api] unhandled error", error);
  return Response.json(
    { error: { code: "INTERNAL", message: "Terjadi kesalahan pada server." } },
    { status: 500 },
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("VALIDATION_ERROR", "Body JSON tidak valid.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError("VALIDATION_ERROR", "Data tidak valid.", zodFieldErrors(result.error));
  }
  return result.data;
}

export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError("VALIDATION_ERROR", "Query tidak valid.", zodFieldErrors(result.error));
  }
  return result.data;
}

export function assertSameOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new ApiError("FORBIDDEN", "Permintaan lintas situs ditolak.");
    }
  } catch {
    throw new ApiError("FORBIDDEN", "Origin tidak valid.");
  }
}
