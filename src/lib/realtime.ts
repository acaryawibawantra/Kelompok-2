"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PresenceUser, ServerEvent } from "./realtime-events";

export interface RealtimeState {
  presence: PresenceUser[];
  connected: boolean;
}

export function useProjectRealtime(projectId: string): RealtimeState {
  const queryClient = useQueryClient();
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let socket: WebSocket | null = null;
    let closed = false;
    let attempts = 0;
    let heartbeat: number | undefined;
    let reconnectTimer: number | undefined;

    function invalidate(): void {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["streak"] });
    }

    function scheduleReconnect(): void {
      attempts += 1;
      const delay = Math.min(15_000, 1000 * 2 ** Math.min(attempts, 4));
      reconnectTimer = window.setTimeout(connect, delay);
    }

    async function connect(): Promise<void> {
      try {
        const response = await fetch(`/api/projects/${projectId}/ws-token`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("ws-token gagal");
        const payload = (await response.json()) as { data: { token: string; url: string } };
        if (closed) return;

        socket = new WebSocket(
          `${payload.data.url}/ws?project=${projectId}&token=${payload.data.token}`,
        );
        socket.onopen = () => {
          attempts = 0;
          setConnected(true);
          heartbeat = window.setInterval(() => {
            socket?.send(JSON.stringify({ t: "ping" }));
          }, 30_000);
        };
        socket.onmessage = (event) => {
          let data: ServerEvent;
          try {
            data = JSON.parse(String(event.data)) as ServerEvent;
          } catch {
            return;
          }
          if (data.t === "presence") {
            setPresence(data.users);
            return;
          }
          if (data.t === "pong") return;
          invalidate();
        };
        socket.onclose = () => {
          setConnected(false);
          if (heartbeat) window.clearInterval(heartbeat);
          if (!closed) scheduleReconnect();
        };
        socket.onerror = () => socket?.close();
      } catch {
        if (!closed) scheduleReconnect();
      }
    }

    void connect();

    return () => {
      closed = true;
      if (heartbeat) window.clearInterval(heartbeat);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [projectId, queryClient]);

  return { presence, connected };
}
