import { describe, expect, it, vi } from "vitest";
import { BASE_URL, createClient, LoootError } from "../src/lib/api";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function setup(responses: Response[], token = "cs_ms_test") {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next;
  }) as unknown as typeof globalThis.fetch;
  const client = createClient({ getToken: async () => token, fetch, sleep: async () => undefined });
  return { client, calls };
}

const headers = (init: RequestInit) => init.headers as Record<string, string>;

describe("public reads", () => {
  it("searches the public catalog without an Authorization header", async () => {
    const { client, calls } = setup([json({ items: [{ catalogItemId: "a", operationId: "a", providerId: "p", title: "P / A" }] })]);
    const items = await client.searchCatalog("verify email", 5);
    expect(items).toHaveLength(1);
    expect(calls[0]!.url).toBe(`${BASE_URL}/v1/public-catalog?q=verify+email&limit=5`);
    expect(headers(calls[0]!.init).authorization).toBeUndefined();
    expect(calls[0]!.init.credentials).toBe("omit");
  });

  it("reads job prices from the overview and keeps only the wanted jobs", async () => {
    const overview = {
      categories: [{ platforms: [{ jobs: [
        { id: "company.enrich", title: "Enrich a company", providerCount: 21, cheapestPerCall: 0.0019, cheapestPerResult: 0.00145 },
        { id: "other.job", title: "Other", providerCount: 1, cheapestPerCall: 1, cheapestPerResult: null },
      ] }] }],
    };
    const { client, calls } = setup([json(overview)]);
    const prices = await client.jobPrices(["company.enrich"]);
    expect(Object.keys(prices)).toEqual(["company.enrich"]);
    expect(prices["company.enrich"]!.cheapestPerCall).toBe(0.0019);
    expect(calls[0]!.url).toBe(`${BASE_URL}/v1/catalog/overview?depth=jobs`);
    expect(headers(calls[0]!.init).authorization).toBeUndefined();
  });

  it("turns a network failure into a readable error", async () => {
    const fetch = (async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof globalThis.fetch;
    const client = createClient({ getToken: async () => "", fetch });
    await expect(client.searchCatalog("x")).rejects.toMatchObject({ code: "network", status: 0 });
  });
});

describe("paid runs", () => {
  it("refuses to call without a token", async () => {
    const { client, calls } = setup([], "");
    await expect(client.runJob("company.enrich", { domain: "stripe.com" }, "k1", { maxAttempts: 3, maxCostUsd: 0.05 })).rejects.toMatchObject({ code: "missing_token" });
    expect(calls).toHaveLength(0);
  });

  it("posts the job with the idempotency key, the fallback cap and the bearer token", async () => {
    const { client, calls } = setup([json({ runId: "run_1", status: "completed", actualCost: 0.0019, result: { name: "Stripe" } })]);
    const run = await client.runJob("company.enrich", { domain: "stripe.com" }, "chrome-company.enrich-1", { maxAttempts: 3, maxCostUsd: 0.05 });
    expect(run.actualCost).toBe(0.0019);
    expect(calls[0]!.url).toBe(`${BASE_URL}/v1/runs?wait=30`);
    expect(calls[0]!.init.method).toBe("POST");
    expect(headers(calls[0]!.init).authorization).toBe("Bearer cs_ms_test");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      endpointId: "job:company.enrich",
      input: { domain: "stripe.com" },
      idempotencyKey: "chrome-company.enrich-1",
      fallback: { enabled: true, maxAttempts: 3, maxCostUsd: 0.05 },
    });
  });

  it("polls GET /v1/runs/{id} until the run is terminal", async () => {
    const { client, calls } = setup([
      json({ runId: "run 2", status: "running" }),
      json({ runId: "run 2", status: "pending_provider" }),
      json({ runId: "run 2", status: "completed", actualCost: 0.004 }),
    ]);
    const run = await client.runJob("people.email.find", { first_name: "Ada", last_name: "Lovelace", domain: "example.com" }, "k", { maxAttempts: 3, maxCostUsd: 0.05 });
    expect(run.status).toBe("completed");
    expect(calls.map((c) => c.url)).toEqual([`${BASE_URL}/v1/runs?wait=30`, `${BASE_URL}/v1/runs/run%202`, `${BASE_URL}/v1/runs/run%202`]);
  });

  it("stops polling at the deadline and returns the unfinished run", async () => {
    let t = 0;
    const fetch = (async () => json({ runId: "r", status: "running" })) as unknown as typeof globalThis.fetch;
    const client = createClient({ getToken: async () => "t", fetch, sleep: async () => { t += 50_000; }, now: () => t });
    const run = await client.runJob("company.enrich", { domain: "a.com" }, "k", { maxAttempts: 1, maxCostUsd: 0.05 }, 90_000);
    expect(run.status).toBe("running");
  });

  it("surfaces the API error code, message and top-up link", async () => {
    const { client } = setup([json({ error: { code: "insufficient_funds", message: "Balance too low." }, topUpUrl: "https://looot.ai/billing" }, 402)]);
    const err = await client.runJob("company.enrich", { domain: "a.com" }, "k", { maxAttempts: 1, maxCostUsd: 0.05 }).catch((e) => e);
    expect(err).toBeInstanceOf(LoootError);
    expect(err).toMatchObject({ status: 402, code: "insufficient_funds", message: "Balance too low.", topUpUrl: "https://looot.ai/billing" });
  });

  it("never puts the token in the URL", async () => {
    const { client, calls } = setup([json({ available: 4.2 })], "token-never-in-url");
    await client.balance();
    expect(calls[0]!.url).not.toContain("token-never-in-url");
  });
});
