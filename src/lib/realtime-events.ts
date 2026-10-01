import type { Subject, Task } from "@/types";

export interface PresenceUser {
  userId: string;
  name: string;
  avatarColor: string;
}

export type ServerEvent =
  | { t: "presence"; users: PresenceUser[] }
  | { t: "subject.created"; subject: Subject }
  | { t: "subject.updated"; subject: Subject }
  | { t: "subject.deleted"; subjectId: string }
  | { t: "task.created"; task: Task }
  | { t: "task.updated"; task: Task }
  | { t: "task.deleted"; taskId: string }
  | { t: "member.changed" }
  | { t: "pong" };

export type ClientEvent = { t: "ping" } | { t: "focus"; taskId: string | null };
