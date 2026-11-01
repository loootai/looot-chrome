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

/** Company card fields, in display order. Labels are message keys. Missing fields are left out. */
export function readCompany(run: RunLike): Field[] {
  const rows: [string, string[]][] = [
    ["fieldName", ["name", "company_name", "companyName", "display_name", "legal_name"]],
    ["fieldIndustry", ["industry", "category", "sector"]],
    ["fieldEmployees", ["employees", "employee_count", "employeeCount", "size", "headcount", "estimated_num_employees"]],
    ["fieldFounded", ["founded", "founded_year", "foundedYear", "year_founded"]],
    ["fieldCountry", ["country", "country_code", "countryCode", "hq_country"]],
    ["fieldCity", ["city", "locality", "hq_city"]],
    ["fieldLinkedIn", ["linkedin_url", "linkedinUrl", "linkedin"]],
    ["fieldAbout", ["description", "short_description", "summary", "tagline"]],
  ];
  return rows.map(([label, keys]) => ({ label, value: pick(run, keys) })).filter((f) => f.value !== "");
}

/** Breadth-first search for the first value of any type under any of the keys. */
export function findNode(source: unknown, keys: string[]): unknown {
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
        for (const [k, v] of entries) if (squash(k) === key && v !== null && v !== undefined && v !== "") return v;
      }
      for (const [, v] of entries) if (v !== null && typeof v === "object") next.push(v);
    }
    level = next;
  }
  return undefined;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** 133172721 becomes "133.2M" in English, "133,2 M" in French. */
export function compact(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function whole(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

function day(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

export interface Card {
  fields: Field[];
  chips: string[];
}

/** Monthly visits, ranks, engagement and traffic sources. Shares come back as 0 to 1. */
export function readTraffic(run: RunLike, locale?: string): Card {
  const src = run.result ?? null;
  const fields: Field[] = [];
  const add = (label: string, value: string) => { if (value) fields.push({ label, value }); };
  let visits = num(findNode(src, ["visits", "monthly_visits", "monthlyVisits"]));
  const series = findNode(src, ["estimatedMonthlyVisits"]);
  if (visits === null && series && typeof series === "object") {
    const last = Object.entries(series as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).pop();
    visits = last ? num(last[1]) : null;
  }
  add("fieldVisits", visits === null ? "" : compact(visits, locale));
  const global = num(findNode(findNode(src, ["globalRank", "global_rank"]), ["rank"]) ?? findNode(src, ["globalRank", "global_rank"]));
  add("fieldGlobalRank", global === null ? "" : `#${whole(global, locale)}`);
  const countryNode = findNode(src, ["countryRank", "country_rank"]);
  const countryRank = num(findNode(countryNode, ["rank"]) ?? countryNode);
  const countryCode = findValue(countryNode, ["countryCode", "country_code"]);
  add("fieldCountryRank", countryRank === null ? "" : `#${whole(countryRank, locale)}${countryCode ? ` (${countryCode})` : ""}`);
  add("fieldCategory", findValue(src, ["category"]));
  const bounce = num(findNode(src, ["bounceRate", "bounce_rate"]));
  add("fieldBounce", bounce === null ? "" : `${Math.round((bounce <= 1 ? bounce * 100 : bounce))}%`);
  const ppv = num(findNode(src, ["pagePerVisit", "pages_per_visit", "pagesPerVisit"]));
  add("fieldPagesPerVisit", ppv === null ? "" : ppv.toFixed(1));
  const time = num(findNode(src, ["timeOnSite", "time_on_site", "avgVisitDuration"]));
  add("fieldTimeOnSite", time === null ? "" : `${Math.floor(time / 60)}:${String(Math.round(time % 60)).padStart(2, "0")}`);
  const chips: string[] = [];
  const sources = findNode(src, ["trafficSources", "traffic_sources"]);
  if (sources && typeof sources === "object" && !Array.isArray(sources)) {
    const rows = Object.entries(sources as Record<string, unknown>)
      .map(([k, v]) => [k, num(v)] as const)
      .filter((r): r is readonly [string, number] => r[1] !== null && r[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    for (const [k, v] of rows) chips.push(`${k.replace(/([a-z])([A-Z])/g, "$1 $2")} ${Math.round(v <= 1 ? v * 100 : v)}%`);
  }
  return { fields, chips };
}

/** Domain rank, backlinks, referring domains and spam score. */
export function readSeo(run: RunLike, locale?: string): Card {
  const fields: Field[] = [];
  const get = (keys: string[]) => num(findNode(run.normalized?.fields ?? null, keys) ?? findNode(run.result ?? null, keys));
  const rank = get(["rank", "domain_rank", "domainRank", "domain_rating"]);
  const backlinks = get(["backlinks", "backlinks_count", "total_backlinks"]);
  const refDomains = get(["referringDomains", "referring_domains", "refdomains"]);
  const spam = get(["backlinks_spam_score", "spam_score"]);
  if (rank !== null) fields.push({ label: "fieldDomainRank", value: whole(rank, locale) });
  if (backlinks !== null) fields.push({ label: "fieldBacklinks", value: compact(backlinks, locale) });
  if (refDomains !== null) fields.push({ label: "fieldRefDomains", value: compact(refDomains, locale) });
  if (spam !== null) fields.push({ label: "fieldSpamScore", value: whole(spam, locale) });
  const first = day(findNode(run.result ?? null, ["first_seen", "firstSeen"]));
  if (first) fields.push({ label: "fieldFirstSeen", value: first });
  return { fields, chips: [] };
}

/** Registrar, dates, owner organisation when public, and name servers. */
export function readWhois(run: RunLike): Card & { redacted: boolean } {
  const src = run.result ?? null;
  const fields: Field[] = [];
  const add = (label: string, value: string) => { if (value) fields.push({ label, value }); };
  const registrant = findNode(src, ["registrant"]);
  add("fieldOwnerOrg", findValue(registrant, ["organization", "org", "name"]));
  add("fieldOwnerCountry", findValue(registrant, ["country", "countryCode"]));
  add("fieldRegistrar", findValue(src, ["registrarName", "registrar"]));
  add("fieldCreated", day(findNode(src, ["createdDate", "creation_date", "created"])));
  add("fieldExpires", day(findNode(src, ["expiresDate", "expiration_date", "expires"])));
  const ageDays = num(findNode(src, ["estimatedDomainAge"]));
  if (ageDays !== null) add("fieldAgeYears", String(Math.floor(ageDays / 365)));
  let hosts = findNode(src, ["hostNames"]);
  if (!Array.isArray(hosts)) hosts = findNode(src, ["name_servers", "nameservers"]);
  const chips = Array.isArray(hosts) ? hosts.filter((x): x is string => typeof x === "string").slice(0, 6).map((x) => x.toLowerCase()) : [];
  const redacted = /mask|redact|privacy/i.test(findValue(src, ["dataError"])) || !findValue(registrant, ["organization", "org", "name"]);
  return { fields, chips, redacted };
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
