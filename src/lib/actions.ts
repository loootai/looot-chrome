// The paid lookups the panel offers, in display order. Job ids are the ones listed in the free
// catalog (GET /v1/catalog/overview?depth=jobs), checked on 2026-11-01. Titles and hints are
// message keys in public/_locales.

export type ActionId = "company" | "whois" | "tech" | "traffic" | "seo" | "email";

export interface Action {
  id: ActionId;
  /** Message key prefix: `<key>Title` and `<key>Hint`. */
  key: string;
  /** Jobs this action may run, in order. Each is one confirmed, capped call. */
  jobs: string[];
}

export const JOB_COMPANY = "company.enrich";
export const JOB_WHOIS = "domain.whois.lookup";
export const JOB_TECH = "company.technographics";
export const JOB_TRAFFIC = "company.traffic";
export const JOB_SEO = "backlinks.domain.summary";
export const JOB_EMAIL_FIND = "people.email.find";
export const JOB_EMAIL_VERIFY = "people.email.verify";

export const ACTIONS: Action[] = [
  { id: "company", key: "actionCompany", jobs: [JOB_COMPANY] },
  { id: "whois", key: "actionWhois", jobs: [JOB_WHOIS] },
  { id: "tech", key: "actionTech", jobs: [JOB_TECH] },
  { id: "traffic", key: "actionTraffic", jobs: [JOB_TRAFFIC] },
  { id: "seo", key: "actionSeo", jobs: [JOB_SEO] },
  { id: "email", key: "actionEmail", jobs: [JOB_EMAIL_FIND, JOB_EMAIL_VERIFY] },
];

export const ALL_JOBS = [...new Set(ACTIONS.flatMap((a) => a.jobs))];

/** A new idempotency key for one confirmed step. */
export function newKey(job: string, uuid: () => string = () => crypto.randomUUID()): string {
  return `chrome-${job}-${uuid()}`;
}
