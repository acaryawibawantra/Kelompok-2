const MIN_GAP = 1e-4;

export function positionBetween(previous: number | null, next: number | null): number {
  if (previous === null && next === null) return 1000;
  if (previous === null) return next! / 2;
  if (next === null) return previous + 1000;
  return (previous + next) / 2;
}

export function needsRebalance(previous: number | null, next: number | null): boolean {
  if (previous === null || next === null) return false;
  return Math.abs(next - previous) < MIN_GAP;
}

export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * 1000);
}
