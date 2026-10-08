import { describe, expect, it } from "vitest";
import { LoootError, type Run } from "../src/lib/api";
import { runStep, type RunnerDeps } from "../src/lib/runner";
import { EMPTY_SPEND, type Spend } from "../src/lib/spend";

function deps(runJob: RunnerDeps["client"]["runJob"], start: Spend = { ...EMPTY_SPEND }, limits = { maxPerCall: 0.05, sessionCap: 0.1 }) {
  let spend = start;
  const history: Spend[] = [];
  const d: RunnerDeps = {
    client: { runJob },
    limits: () => limits,
    getSpend: () => spend,
    setSpend: (s) => { spend = s; history.push(s); },
  };
  return { d, history, spend: () => spend };
}

const completed = (cost: number): Run => ({ runId: "r", status: "completed", actualCost: cost });

describe("runStep", () => {
  it("reserves the cap while the run is in flight, then counts the actual cost", async () => {
    const { d, history, spend } = deps(async (_job, _input, _key, fallback) => {
      expect(fallback).toEqual({ maxAttempts: 3, maxCostUsd: 0.05 });
      return completed(0.0019);
    });
    const step = await runStep(d, "company.enrich", { domain: "stripe.com" }, "key-1");
    expect(history[0]).toEqual({ spent: 0, reserved: 0.05, runs: 0 });
    expect(spend()).toEqual({ spent: 0.0019, reserved: 0, runs: 1 });
    expect(step).toMatchObject({ counted: 0.0019, settled: true });
  });

  it("blocks before any request when the call could pass the session cap", async () => {
    let called = false;
    const { d, spend } = deps(async () => { called = true; return completed(0); }, { spent: 0.06, reserved: 0, runs: 3 });
    await expect(runStep(d, "company.enrich", { domain: "a.com" }, "k")).rejects.toMatchObject({ code: "session_cap" });
    expect(called).toBe(false);
    expect(spend().spent).toBe(0.06);
  });

  it("counts a failed run as $0", async () => {
    const { d, spend } = deps(async () => ({ runId: "r", status: "failed", actualCost: 0, error: { code: "provider_error", message: "x" } }));
    const step = await runStep(d, "company.enrich", { domain: "a.com" }, "k");
    expect(step.counted).toBe(0);
    expect(spend()).toEqual({ spent: 0, reserved: 0, runs: 1 });
  });

  it("releases the reservation when looot refuses the call", async () => {
    const { d, spend } = deps(async () => { throw new LoootError(401, "unauthorized", "no"); });
    await expect(runStep(d, "company.enrich", { domain: "a.com" }, "k")).rejects.toMatchObject({ status: 401 });
    expect(spend().spent).toBe(0);
    expect(spend().reserved).toBe(0);
  });

  it("counts the full cap when the outcome is unknown", async () => {
    const network = deps(async () => { throw new LoootError(0, "network", "offline"); });
    await expect(runStep(network.d, "company.enrich", { domain: "a.com" }, "k")).rejects.toMatchObject({ code: "network" });
    expect(network.spend().spent).toBe(0.05);

    const slow = deps(async () => ({ runId: "r", status: "running" }));
    const step = await runStep(slow.d, "company.enrich", { domain: "a.com" }, "k");
    expect(step).toMatchObject({ settled: false, counted: 0.05 });
    expect(slow.spend()).toEqual({ spent: 0.05, reserved: 0, runs: 1 });
  });

  it("two steps started together cannot pass the cap", async () => {
    let release: (r: Run) => void = () => undefined;
    const first = new Promise<Run>((r) => { release = r; });
    let n = 0;
    const { d } = deps(async () => (n++ === 0 ? first : completed(0.01)), { ...EMPTY_SPEND }, { maxPerCall: 0.05, sessionCap: 0.08 });
    const a = runStep(d, "company.enrich", { domain: "a.com" }, "k1");
    await Promise.resolve();
    await expect(runStep(d, "company.technographics", { domain: "a.com" }, "k2")).rejects.toMatchObject({ code: "session_cap" });
    release(completed(0.002));
    await a;
  });
});
