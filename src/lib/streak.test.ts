import { describe, expect, it } from "vitest";
import { computeStreak } from "./streak";

const TZ = "Asia/Jakarta";
const GOAL = 3;

function at(iso: string): Date {
  return new Date(iso);
}

describe("computeStreak", () => {
  it("memberi streak 0 untuk user baru", () => {
    const result = computeStreak({
      activity: [],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.activeToday).toBe(false);
    expect(result.totalCompleted).toBe(0);
    expect(result.days).toHaveLength(84);
  });

  it("menghitung streak 1 bila hanya kemarin aktif", () => {
    const result = computeStreak({
      activity: [{ date: "2026-03-09", count: 2 }],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.current).toBe(1);
    expect(result.activeToday).toBe(false);
  });

  it("menghitung streak 2 bila hari ini dan kemarin aktif", () => {
    const result = computeStreak({
      activity: [
        { date: "2026-03-09", count: 1 },
        { date: "2026-03-10", count: 4 },
      ],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.current).toBe(2);
    expect(result.activeToday).toBe(true);
    expect(result.todayCount).toBe(4);
    expect(result.goalReachedToday).toBe(true);
  });

  it("mereset streak bila ada jeda satu hari", () => {
    const result = computeStreak({
      activity: [
        { date: "2026-03-05", count: 3 },
        { date: "2026-03-06", count: 3 },
        { date: "2026-03-08", count: 3 },
      ],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it("menghormati pergantian hari di timezone Jakarta", () => {
    const activity = [
      { date: "2026-03-09", count: 1 },
      { date: "2026-03-10", count: 1 },
    ];

    const beforeMidnight = computeStreak({
      activity,
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T16:59:00Z"),
    });
    expect(beforeMidnight.current).toBe(2);
    expect(beforeMidnight.activeToday).toBe(true);

    const afterMidnight = computeStreak({
      activity,
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T17:01:00Z"),
    });
    expect(afterMidnight.current).toBe(2);
    expect(afterMidnight.activeToday).toBe(false);
  });

  it("menurunkan hitungan saat undo (mengikuti kondisi akhir)", () => {
    const withDone = computeStreak({
      activity: [{ date: "2026-03-10", count: 1 }],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(withDone.todayCount).toBe(1);
    expect(withDone.activeToday).toBe(true);

    const afterUndo = computeStreak({
      activity: [{ date: "2026-03-10", count: 0 }],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(afterUndo.todayCount).toBe(0);
    expect(afterUndo.activeToday).toBe(false);
    expect(afterUndo.current).toBe(0);
    expect(afterUndo.totalCompleted).toBe(0);
  });

  it("membedakan longest dan current", () => {
    const result = computeStreak({
      activity: [
        { date: "2026-01-01", count: 1 },
        { date: "2026-01-02", count: 1 },
        { date: "2026-01-03", count: 1 },
        { date: "2026-01-04", count: 1 },
        { date: "2026-03-09", count: 1 },
        { date: "2026-03-10", count: 1 },
      ],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.longest).toBe(4);
    expect(result.current).toBe(2);
  });

  it("menyusun heatmap 84 hari terakhir", () => {
    const result = computeStreak({
      activity: [],
      timezone: TZ,
      dailyGoal: GOAL,
      now: at("2026-03-10T04:00:00Z"),
    });
    expect(result.days[result.days.length - 1]!.date).toBe("2026-03-10");
    expect(result.days[0]!.date).toBe("2025-12-17");
  });
});
