import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck, Flame, LayoutGrid, Users } from "lucide-react";

const FEATURES = [
  { icon: LayoutGrid, text: "Canvas project → subject → task, tanpa tab berlapis" },
  { icon: CalendarCheck, text: "Presensi kuliah harian, rekap mingguan siap dibagikan" },
  { icon: Flame, text: "Streak, target harian, dan heatmap aktivitas" },
  { icon: Users, text: "Kolaborasi tim kecil secara realtime" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[#1c1a17] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Contour lines: parchment/topographic texture instead of a gradient blob. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.07]"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          {Array.from({ length: 14 }, (_, index) => (
            <path
              key={index}
              d={`M-40 ${70 + index * 56} C 120 ${20 + index * 56}, 240 ${140 + index * 52}, 400 ${
                70 + index * 56
              } S 560 ${20 + index * 58}, 660 ${90 + index * 56}`}
            />
          ))}
        </svg>

        <Link href="/" className="relative flex items-center gap-2.5 self-start rounded-xl">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-[11px] bg-brand-500 text-[15px] font-semibold italic leading-none text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            sb
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">
            Semangat <span className="text-brand-300">Brow</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
            Ruang kerja mahasiswa
          </p>
          <h2
            className="mt-4 text-[2.75rem] leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Kuliah, tugas, dan presensi dalam satu tempat.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/80">
                <Icon className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Gratis, jalan di browser, bisa dipasang seperti aplikasi.
        </p>
      </div>

      <div className="flex items-center justify-center bg-canvas p-5 sm:p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
