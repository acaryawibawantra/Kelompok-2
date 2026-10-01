import { nanoid } from "nanoid";

export function newId(prefix: string): string {
  return `${prefix}_${nanoid(12)}`;
}

export function newToken(): string {
  return `tc-inv-${nanoid(24)}`;
}
