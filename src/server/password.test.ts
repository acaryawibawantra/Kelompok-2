import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("menghasilkan hash dan salt berbeda untuk password sama", async () => {
    const a = await hashPassword("password123");
    const b = await hashPassword("password123");
    expect(a.hash).not.toBe(b.hash);
    expect(a.salt).not.toBe(b.salt);
  });

  it("memverifikasi password yang benar", async () => {
    const { hash, salt } = await hashPassword("rahasia-ku");
    expect(await verifyPassword("rahasia-ku", hash, salt)).toBe(true);
  });

  it("menolak password yang salah", async () => {
    const { hash, salt } = await hashPassword("rahasia-ku");
    expect(await verifyPassword("salah", hash, salt)).toBe(false);
  });

  it("dapat memakai ulang salt saat verifikasi", async () => {
    const { hash, salt } = await hashPassword("abc12345");
    const recomputed = await hashPassword("abc12345", salt);
    expect(recomputed.hash).toBe(hash);
  });
});
