// Session spend counter and cap. Money in flight is reserved at the most the run can charge,
// so two actions started together cannot pass the cap between them.

export interface Spend {
  /** Dollars charged by finished runs this browser session. */
  spent: number;
  /** Dollars held for runs that have started and not yet reported a cost. */
  reserved: number;
  runs: number;
}

export const EMPTY_SPEND: Spend = { spent: 0, reserved: 0, runs: 0 };

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/** True when a run that can charge up to maxCost still fits under the cap. */
export function canSpend(s: Spend, cap: number, maxCost: number): boolean {
  return round(s.spent + s.reserved + maxCost) <= round(cap);
}

export function left(s: Spend, cap: number): number {
  return Math.max(0, round(cap - s.spent - s.reserved));
}

export function reserve(s: Spend, maxCost: number): Spend {
  return { ...s, reserved: round(s.reserved + maxCost) };
}

/**
 * Releases a reservation. `actual` is the run's actualCost. When the outcome is unknown (the run
 * was still going when polling stopped) pass null and the full reservation counts as spent.
 */
export function settle(s: Spend, maxCost: number, actual: number | null): Spend {
  return {
    spent: round(s.spent + (actual === null ? maxCost : Math.max(0, actual))),
    reserved: Math.max(0, round(s.reserved - maxCost)),
    runs: s.runs + 1,
  };
}
