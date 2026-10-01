import { DurableObject } from "cloudflare:workers";

export interface Env {
  PROJECT_ROOM: DurableObjectNamespace<ProjectRoom>;
}

export interface ServerEvent {
  t: string;
  [key: string]: unknown;
}

interface ConnectionState {
  userId: string;
  name: string;
  avatarColor: string;
}

export class ProjectRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, room: this.ctx.id.toString() });
    }

    if (url.pathname === "/broadcast" && request.method === "POST") {
      const event = (await request.json()) as ServerEvent;
      this.broadcast(event);
      return Response.json({ ok: true, delivered: this.ctx.getWebSockets().length });
    }

    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    return new Response("ProjectRoom", { status: 200 });
  }

  private handleWebSocket(request: Request): Response {
    const url = new URL(request.url);
    const user: ConnectionState = {
      userId: url.searchParams.get("userId") ?? "unknown",
      name: url.searchParams.get("name") ?? "Anonim",
      avatarColor: url.searchParams.get("avatarColor") ?? "#5b5ce2",
    };

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(user);
    this.broadcastPresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    let event: { t?: string };
    try {
      event = JSON.parse(message) as { t?: string };
    } catch {
      return;
    }
    if (event.t === "ping") {
      ws.send(JSON.stringify({ t: "pong" }));
    }
  }

  async webSocketClose(): Promise<void> {
    this.broadcastPresence();
  }

  async webSocketError(): Promise<void> {
    this.broadcastPresence();
  }

  private broadcast(event: ServerEvent): void {
    const data = JSON.stringify(event);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(data);
      } catch {
        /* socket sudah tertutup */
      }
    }
  }

  private broadcastPresence(): void {
    const users = this.ctx.getWebSockets().map((socket) => {
      const attachment = socket.deserializeAttachment() as ConnectionState | null;
      return {
        userId: attachment?.userId ?? "unknown",
        name: attachment?.name ?? "Anonim",
        avatarColor: attachment?.avatarColor ?? "#5b5ce2",
      };
    });
    const unique = Array.from(new Map(users.map((user) => [user.userId, user])).values());
    this.broadcast({ t: "presence", users: unique });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("project") ?? "default";
    const stub = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(projectId));
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
