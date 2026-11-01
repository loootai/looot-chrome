// The paid lookups the panel offers. Job ids are the ones listed in the free catalog
// (GET /v1/catalog/overview?depth=jobs), checked on 2026-11-01. Titles, hints and field labels are
// message keys in public/_locales. Which lookups show first depends on the page kind.

import type { Page, PageKind } from "./page";

export type ActionId = "company" | "whois" | "tech" | "traffic" | "seo" | "news" | "linkedin" | "email" | "verify";

export interface FormField {
  key: string;
  /** Message key for the label. */
  label: string;
  type: "text" | "email" | "url";
  prefill?: (p: Page) => string;
}

export interface Action {
  id: ActionId;
  /** Message key prefix: `<key>Title` and `<key>Hint`. */
  key: string;
  /** Jobs this action may run, in order. Each is one confirmed, capped call. */
  jobs: string[];
  /** True when the lookup makes sense on this page. */
  when: (p: Page) => boolean;
  /** Fields the user fills in before the price shows. */
  fields: (p: Page) => FormField[];
  /** Input for the first job, from the page and the filled fields. */
  input: (p: Page, v: Record<string, string>) => Record<string, string>;
}

export const JOB_COMPANY = "company.enrich";
export const JOB_WHOIS = "domain.whois.lookup";
export const JOB_TECH = "company.technographics";
export const JOB_TRAFFIC = "company.traffic";
export const JOB_SEO = "backlinks.domain.summary";
export const JOB_NEWS = "news.search";
export const JOB_LINKEDIN = "linkedin.person.profile";
export const JOB_EMAIL_FIND = "people.email.find";
export const JOB_EMAIL_VERIFY = "people.email.verify";

const hasDomain = (p: Page) => p.domain !== null;
const onDomain = (p: Page) => ({ domain: p.domain ?? "" });
const none = () => [];

export const ACTIONS: Action[] = [
  { id: "company", key: "actionCompany", jobs: [JOB_COMPANY], when: (p) => hasDomain(p) || p.kind === "linkedinCompany", fields: none,
    input: (p): Record<string, string> => (p.domain ? { domain: p.domain } : { linkedin_url: p.linkedinUrl ?? "" }) },
  { id: "whois", key: "actionWhois", jobs: [JOB_WHOIS], when: hasDomain, fields: none, input: onDomain },
  { id: "tech", key: "actionTech", jobs: [JOB_TECH], when: hasDomain, fields: none, input: onDomain },
  { id: "traffic", key: "actionTraffic", jobs: [JOB_TRAFFIC], when: hasDomain, fields: none, input: onDomain },
  { id: "seo", key: "actionSeo", jobs: [JOB_SEO], when: hasDomain, fields: none, input: onDomain },
  { id: "news", key: "actionNews", jobs: [JOB_NEWS], when: () => true,
    fields: () => [{ key: "query", label: "fieldQuery", type: "text", prefill: (p) => p.name || p.domain || "" }],
    input: (_p, v) => ({ query: v.query ?? "" }) },
  { id: "linkedin", key: "actionLinkedin", jobs: [JOB_LINKEDIN], when: (p) => p.kind !== "linkedinCompany",
    fields: (p) => (p.kind === "linkedinPerson" ? [] : [{ key: "url", label: "fieldProfileUrl", type: "url" }]),
    input: (p, v) => ({ linkedin_url: p.kind === "linkedinPerson" ? p.linkedinUrl ?? "" : v.url ?? "" }) },
  { id: "email", key: "actionEmail", jobs: [JOB_EMAIL_FIND, JOB_EMAIL_VERIFY], when: (p) => hasDomain(p) || p.kind === "linkedinPerson",
    fields: (p) => (p.kind === "linkedinPerson" ? [] : [{ key: "first", label: "firstName", type: "text" }, { key: "last", label: "lastName", type: "text" }]),
    input: (p, v): Record<string, string> => (p.kind === "linkedinPerson" ? { linkedin_url: p.linkedinUrl ?? "" } : { first_name: v.first ?? "", last_name: v.last ?? "", domain: p.domain ?? "" }) },
  { id: "verify", key: "actionVerify", jobs: [JOB_EMAIL_VERIFY], when: () => true,
    fields: () => [{ key: "email", label: "fieldEmail", type: "email" }],
    input: (_p, v) => ({ email: v.email ?? "" }) },
];

/** Most useful first for each page kind. The first few show open, the rest under "More lookups". */
const ORDER: Record<PageKind, ActionId[]> = {
  company: ["company", "tech", "traffic", "seo", "whois", "news", "email", "verify", "linkedin"],
  team: ["email", "verify", "linkedin", "company", "news", "tech", "traffic", "seo", "whois"],
  article: ["company", "news", "whois", "traffic", "seo", "tech", "email", "verify", "linkedin"],
  linkedinPerson: ["linkedin", "email", "verify", "news"],
  linkedinCompany: ["company", "news", "verify"],
  none: ["verify", "linkedin", "news"],
};
export const PRIMARY_COUNT = 4;

/** The lookups that fit this page, most useful first. */
export function actionsFor(p: Page): Action[] {
  const byId = new Map(ACTIONS.map((a) => [a.id, a]));
  return ORDER[p.kind].map((id) => byId.get(id)!).filter((a) => a.when(p));
}

/** Field values that are still empty, so the form can say which. */
export function missing(action: Action, p: Page, v: Record<string, string>): string[] {
  return action.fields(p).filter((f) => !(v[f.key] ?? "").trim()).map((f) => f.key);
}

export const ALL_JOBS = [...new Set(ACTIONS.flatMap((a) => a.jobs))];

/** A new idempotency key for one confirmed step. */
export function newKey(job: string, uuid: () => string = () => crypto.randomUUID()): string {
  return `chrome-${job}-${uuid()}`;
}
