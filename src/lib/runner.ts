// Runs one confirmed paid step under the per-call cap and the session cap, and keeps the
// session counter right whatever happens to the request.

import { LoootError, TERMINAL, type Client, type Run } from "./api";
import { canSpend, left, reserve, settle, type Spend } from "./spend";
import { usd } from "./format";

export interface RunnerDeps {
  client: Pick<Client, "runJob">;
  limits: () => { maxPerCall: number; sessionCap: number };
  getSpend: () => Spend;
  setSpend: (s: Spend) => Promise<void> | void;
}

export interface StepResult {
  run: Run;
  /** Dollars this step added to the session counter. */
  counted: number;
  /** False when polling stopped before the run finished; the cap was counted to stay safe. */
  settled: boolean;
}

/** Throws LoootError("session_cap") before any request when the step could pass the session cap. */
export async function runStep(deps: RunnerDeps, job: string, input: Record<string, string>, idempotencyKey: string): Promise<StepResult> {
  const { maxPerCall, sessionCap } = deps.limits();
  const before = deps.getSpend();
  if (!canSpend(before, sessionCap, maxPerCall)) {
    throw new LoootError(
      0,
      "session_cap",
      `This call can charge up to ${usd(maxPerCall)} and only ${usd(left(before, sessionCap))} is left under your ${usd(sessionCap)} session cap. Raise the cap or reset the counter in Settings.`,
    );
  }
  await deps.setSpend(reserve(before, maxPerCall));
  let run: Run;
  try {
    run = await deps.client.runJob(job, input, idempotencyKey, { maxAttempts: 3, maxCostUsd: maxPerCall });
  } catch (err) {
    // A 4xx answer means looot refused the call and charged nothing. Anything else is unknown.
    const refused = err instanceof LoootError && err.status >= 400 && err.status < 500;
    await deps.setSpend(settle(deps.getSpend(), maxPerCall, refused ? 0 : null));
    throw err;
  }
  const settled = TERMINAL.has(run.status);
  const actual = settled ? Math.max(0, run.actualCost ?? 0) : null;
  await deps.setSpend(settle(deps.getSpend(), maxPerCall, actual));
  return { run, counted: actual ?? maxPerCall, settled };
}
