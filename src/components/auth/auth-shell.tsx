import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

const FEATURES = [
  "Canvas visual Project → Subject → Task",
  "Streak harian, target, dan heatmap aktivitas",
  "Kolaborasi tim secara realtime",
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold">
            Task<span className="text-white/70">Canvas</span>
          </span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="font-title text-6xl leading-[1.02]">
            Susun tugas kuliahmu seperti kanvas.
          </h2>
          <ul className="space-y-2.5 text-sm text-white/85">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/20">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Dibuat untuk mahasiswa dan tim kecil yang ingin tetap konsisten.
        </p>
      </div>

      <div className="flex items-center justify-center bg-canvas p-5 sm:p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
