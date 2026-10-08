// looot REST client for the side panel. Plain fetch, no dependencies.
// Request shapes follow https://api.looot.ai/openapi.json. Every request goes to BASE_URL.

export const BASE_URL = "https://api.looot.ai";
export const TERMINAL = new Set(["completed", "failed", "blocked", "stopped"]);

export class LoootError extends Error {
  status: number;
  code: string;
  topUpUrl?: string;
  constructor(status: number, code: string, message: string, topUpUrl?: string) {
    super(message);
    this.name = "LoootError";
    this.status = status;
    this.code = code;
    this.topUpUrl = topUpUrl;
  }
}

export interface CatalogItem {
  catalogItemId: string;
  providerId: string;
  operationId: string;
  title: string;
  description?: string;
  capabilities?: string[];
  price?: { state?: string; amountMicros?: number | null; currency?: string; unit?: string } | null;
}

export interface JobPrice {
  id: string;
  title: string;
  providerCount: number;
  cheapestPerCall: number | null;
  cheapestPerResult: number | null;
}

export interface Run {
  runId: string;
  status: string;
  result?: unknown;
  normalized?: { fields?: Record<string, unknown> };
  actualCost?: number | null;
  route?: { servedBy?: string; chargedUsd?: number };
  error?: { code?: string; message?: string } | null;
  replayed?: boolean;
}

export interface Fallback {
  maxAttempts: number;
  maxCostUsd: number;
}

export interface ClientOptions {
  /** Returns the user's token, or "" when none is saved. Read at call time, never cached here. */
  getToken: () => Promise<string>;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

type Query = Record<string, string | number>;

/** Builds the client. Public reads send no Authorization header; paid calls need the token. */
export function createClient(opts: ClientOptions) {
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? (() => Date.now());

  async function request<T>(method: "GET" | "POST", path: string, o: { query?: Query; body?: unknown; auth: boolean }): Promise<T> {
    const url = new URL(BASE_URL + path);
    for (const [k, v] of Object.entries(o.query ?? {})) url.searchParams.set(k, String(v));
    const headers: Record<string, string> = { accept: "application/json" };
    if (o.auth) {
      const token = (await opts.getToken()).trim();
      if (!token) throw new LoootError(401, "missing_token", "Add your looot token in Settings first.");
      headers.authorization = `Bearer ${token}`;
    }
    if (o.body !== undefined) headers["content-type"] = "application/json";
    let res: Response;
    try {
      res = await doFetch(url.toString(), {
        method,
        headers,
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
        credentials: "omit",
        cache: "no-store",
      });
    } catch {
      throw new LoootError(0, "network", "Could not reach api.looot.ai. Check your connection and try again.");
    }
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const body = data as { error?: { code?: string; message?: string } | string; message?: string; topUpUrl?: string } | null;
      const err = body && typeof body.error === "object" ? body.error : null;
      const code = err?.code ?? (typeof body?.error === "string" ? body.error : `http_${res.status}`);
      const message = err?.message ?? body?.message ?? `looot answered HTTP ${res.status}.`;
      throw new LoootError(res.status, code, message, body?.topUpUrl);
    }
    return data as T;
  }

  return {
    /** Free, no token. Searches the public catalog. */
    async searchCatalog(q: string, limit = 20): Promise<CatalogItem[]> {
      const data = await request<{ items?: CatalogItem[] }>("GET", "/v1/public-catalog", { query: { q, limit }, auth: false });
      return data?.items ?? [];
    },

    /** Free, no token. Cheapest listed price for each wanted job id. */
    async jobPrices(wanted: string[]): Promise<Record<string, JobPrice>> {
      type Raw = { categories?: { platforms?: { jobs?: JobPrice[] }[] }[] };
      const data = await request<Raw>("GET", "/v1/catalog/overview", { query: { depth: "jobs" }, auth: false });
      const out: Record<string, JobPrice> = {};
      for (const cat of data?.categories ?? []) {
        for (const p of cat.platforms ?? []) {
          for (const j of p.jobs ?? []) {
            if (!wanted.includes(j.id) || out[j.id]) continue;
            out[j.id] = {
              id: j.id,
              title: j.title,
              providerCount: j.providerCount ?? 0,
              cheapestPerCall: j.cheapestPerCall ?? null,
              cheapestPerResult: j.cheapestPerResult ?? null,
            };
          }
        }
      }
      return out;
    },

    /** Free, needs the token. */
    balance(): Promise<{ available: number; topUpUrl?: string | null }> {
      return request("GET", "/v1/balance", { auth: true });
    },

    /**
     * Paid. Runs `job:<job>` with provider fallback, capped at fallback.maxCostUsd for the whole
     * call. The same idempotency key with the same body returns the first run, so a retry never
     * pays twice. Polls until the run is terminal or timeoutMs passes.
     */
    async runJob(job: string, input: Record<string, string>, idempotencyKey: string, fallback: Fallback, timeoutMs = 90_000): Promise<Run> {
      let run = await request<Run>("POST", "/v1/runs", {
        query: { wait: 30 },
        body: { endpointId: `job:${job}`, input, idempotencyKey, fallback: { enabled: true, ...fallback } },
        auth: true,
      });
      const deadline = now() + timeoutMs;
      while (!TERMINAL.has(run.status) && now() < deadline) {
        await sleep(2_000);
        run = await request<Run>("GET", `/v1/runs/${encodeURIComponent(run.runId)}`, { auth: true });
      }
      return run;
    },
  };
}

export type Client = ReturnType<typeof createClient>;
