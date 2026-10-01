import { createProjectSchema, projectScopeSchema } from "@/lib/schemas";
import { assertSameOrigin, handleError, json, parseJson } from "@/server/http";
import { requireUser } from "@/server/session";
import { createProject, listProjects } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const scope = projectScopeSchema.catch("all").parse(url.searchParams.get("scope") ?? "all");
    const archived = url.searchParams.get("archived") === "true";
    return json(await listProjects(user, { scope, archived }));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const input = await parseJson(request, createProjectSchema);
    return json(await createProject(user, input), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
