// Reads answers. Providers answer in their own shapes, so readers look at the normalized block
// first and then search the raw result for common key names.

export interface RunLike {
  status: string;
  result?: unknown;
  normalized?: { fields?: Record<string, unknown> };
}

function squash(k: string): string {
  return k.toLowerCase().replace(/[\s_\-.]/g, "");
}

function scalar(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

/** Breadth-first search for the first non-empty scalar under any of the keys, at most 5 levels deep. */
export function findValue(source: unknown, keys: string[]): string {
  const wanted = keys.map(squash);
  let level: unknown[] = [source];
  for (let depth = 0; depth < 5 && level.length > 0; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (node === null || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        next.push(...node.slice(0, 5));
        continue;
      }
      const entries = Object.entries(node as Record<string, unknown>);
      for (const key of wanted) {
        for (const [k, v] of entries) {
          if (squash(k) !== key) continue;
          const s = scalar(v);
          if (s) return s;
        }
      }
      for (const [, v] of entries) if (v !== null && typeof v === "object") next.push(v);
    }
    level = next;
  }
  return "";
}

function pick(run: RunLike, keys: string[]): string {
  return findValue(run.normalized?.fields ?? null, keys) || findValue(run.result ?? null, keys);
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/** The found email from the normalized block, else the first address in the raw result. */
export function readEmail(run: RunLike): string {
  const direct = pick(run, ["email", "work_email", "emailAddress"]);
  if (direct && EMAIL_RE.test(direct)) return direct.match(EMAIL_RE)?.[0] ?? "";
  const m = JSON.stringify(run.result ?? "").match(EMAIL_RE);
  return m ? m[0] : "";
}

const STATUS_WORDS: Record<string, string> = {
  valid: "valid", deliverable: "valid", ok: "valid", safe: "valid", verified: "valid",
  invalid: "invalid", undeliverable: "invalid", bounce: "invalid", bad: "invalid",
  catchall: "catch-all", acceptall: "catch-all",
  risky: "risky", unknown: "unknown",
};

/** One status word: valid, invalid, catch-all, risky or unknown. Empty when the answer has none. */
export function readStatus(run: RunLike): string {
  const raw = pick(run, ["email_status", "verdict", "result", "status", "check", "state"]);
  return STATUS_WORDS[squash(raw)] ?? (raw ? "unknown" : "");
}

export interface Field {
  label: string;
  value: string;
}

/** Company card fields, in display order. Fields the provider did not return are left out. */
export function readCompany(run: RunLike): Field[] {
  const rows: [string, string[]][] = [
    ["Name", ["name", "company_name", "companyName", "display_name", "legal_name"]],
    ["Industry", ["industry", "category", "sector"]],
    ["Employees", ["employees", "employee_count", "employeeCount", "size", "headcount", "estimated_num_employees"]],
    ["Founded", ["founded", "founded_year", "foundedYear", "year_founded"]],
    ["Country", ["country", "country_code", "countryCode", "hq_country"]],
    ["City", ["city", "locality", "hq_city"]],
    ["LinkedIn", ["linkedin_url", "linkedinUrl", "linkedin"]],
    ["About", ["description", "short_description", "summary", "tagline"]],
  ];
  return rows.map(([label, keys]) => ({ label, value: pick(run, keys) })).filter((f) => f.value !== "");
}

const TECH_KEY = /tech|stack|tool|framework|product/i;
const NAME_KEYS = ["name", "technology", "tech", "title", "product", "slug"];

/** Technology names found anywhere in the answer, de-duplicated, at most `max`. */
export function readTechnologies(run: RunLike, max = 60): string[] {
  const out = new Set<string>();
  const visit = (node: unknown, underTech: boolean, depth: number) => {
    if (out.size >= max || depth > 6 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (out.size >= max) return;
        if (typeof item === "string") {
          if (underTech && item.trim() && item.length <= 60) out.add(item.trim());
        } else if (item && typeof item === "object" && !Array.isArray(item) && underTech) {
          const rec = item as Record<string, unknown>;
          const key = NAME_KEYS.find((k) => typeof rec[k] === "string" && (rec[k] as string).trim() !== "");
          if (key) out.add((rec[key] as string).trim());
          for (const [k, v] of Object.entries(rec)) if (v && typeof v === "object") visit(v, TECH_KEY.test(k), depth + 1);
        } else {
          visit(item, underTech, depth + 1);
        }
      }
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (v && typeof v === "object") visit(v, underTech || TECH_KEY.test(k), depth + 1);
      }
    }
  };
  visit(run.normalized?.fields ?? null, false, 0);
  visit(run.result ?? null, false, 0);
  return [...out];
}
