import { getEnv } from "./env";
import type { ServerEvent } from "@/lib/realtime-events";

export async function broadcast(projectId: string, event: ServerEvent): Promise<void> {
  try {
    const env = getEnv();
    const id = env.PROJECT_ROOM.idFromName(projectId);
    const stub = env.PROJECT_ROOM.get(id);
    await stub.fetch("https://do/broadcast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("[realtime] broadcast gagal", error);
  }
}
