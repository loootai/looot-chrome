// Settings and the session counter. The token lives in chrome.storage.local only: it is not
// synced to the Google account, not written to any log and never sent anywhere but api.looot.ai.

import { EMPTY_SPEND, type Spend } from "./spend";

export interface Settings {
  token: string;
  /** Most one call can charge, across every provider tried. */
  maxPerCall: number;
  /** Most the panel may spend per browser session. */
  sessionCap: number;
}

export const DEFAULTS: Settings = { token: "", maxPerCall: 0.1, sessionCap: 1 };

export interface Area {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback);

export async function loadSettings(local: Area): Promise<Settings> {
  const raw = await local.get(["token", "maxPerCall", "sessionCap"]);
  return {
    token: typeof raw.token === "string" ? raw.token : "",
    maxPerCall: num(raw.maxPerCall, DEFAULTS.maxPerCall),
    sessionCap: num(raw.sessionCap, DEFAULTS.sessionCap),
  };
}

export async function saveToken(local: Area, token: string): Promise<void> {
  const t = token.trim();
  if (t) await local.set({ token: t });
  else await local.remove(["token"]);
}

export function saveLimits(local: Area, maxPerCall: number, sessionCap: number): Promise<void> {
  return local.set({ maxPerCall, sessionCap });
}

export async function loadSpend(session: Area): Promise<Spend> {
  const raw = (await session.get(["spend"])).spend as Partial<Spend> | undefined;
  if (!raw) return { ...EMPTY_SPEND };
  // A reservation left by a panel that was closed mid-run counts as spent: the run may have charged.
  return { spent: Math.round((num(raw.spent, 0) + num(raw.reserved, 0)) * 1e6) / 1e6, reserved: 0, runs: num(raw.runs, 0) };
}

export function saveSpend(session: Area, spend: Spend): Promise<void> {
  return session.set({ spend });
}
