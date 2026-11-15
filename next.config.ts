import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// ponytail: init ini spawn workerd (getPlatformProxy) walau saat `next build`.
// Di host tanpa VA 48-bit (ARM64 SBC) workerd crash tcmalloc — matikan lewat
// DISABLE_CF_DEV_BINDINGS=1 untuk build lokal. Hapus gate saat build pindah ke x64/CI.
if (process.env.DISABLE_CF_DEV_BINDINGS !== "1") {
  initOpenNextCloudflareForDev();
}
