"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useStreak } from "@/lib/queries";
import { useHydrated } from "@/lib/use-hydrated";

const COLORS = ["#5b5ce2", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9"];

function Celebration({ reached, today }: { reached: boolean; today: string }) {
  const [visible, setVisible] = useState(() => {
    if (!reached) return false;
    try {
      return window.localStorage.getItem("tc-goal-celebrated") !== today;
    } catch {
      return reached;
    }
  });

  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: (index * 37) % 100,
        delay: ((index * 13) % 10) / 30,
        duration: 1.4 + ((index * 7) % 9) / 10,
        color: COLORS[index % COLORS.length]!,
        rotate: (index * 53) % 360,
      })),
    [],
  );

  useEffect(() => {
    if (!visible) return;
    try {
      window.localStorage.setItem("tc-goal-celebrated", today);
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, [visible, today]);

  if (!visible) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{ left: `${piece.left}%`, backgroundColor: piece.color }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: "105vh", opacity: [0, 1, 1, 0], rotate: piece.rotate }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
        />
      ))}
      <div className="absolute inset-x-0 top-24 flex justify-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-foreground/90 px-4 py-2 text-sm font-medium text-canvas shadow-pop"
        >
          Target harian tercapai!
        </motion.p>
      </div>
    </div>,
    document.body,
  );
}

export function GoalCelebration() {
  const hydrated = useHydrated();
  const { data } = useStreak();

  if (!hydrated || !data) return null;
  const today = data.days[data.days.length - 1]?.date;
  if (!today) return null;

  return (
    <Celebration key={`${today}-${data.goalReachedToday}`} reached={data.goalReachedToday} today={today} />
  );
}
