// The paid actions the panel offers. Job ids and titles are the ones listed in the free catalog
// (GET /v1/catalog/overview?depth=jobs), checked on 2026-10-08.

export interface Action {
  id: "company" | "email" | "tech";
  title: string;
  hint: string;
  /** Jobs this action may run, in order. Each is one confirmed, capped call. */
  jobs: string[];
}

export const JOB_COMPANY = "company.enrich";
export const JOB_EMAIL_FIND = "people.email.find";
export const JOB_EMAIL_VERIFY = "people.email.verify";
export const JOB_TECH = "company.technographics";

export const ALL_JOBS = [JOB_COMPANY, JOB_EMAIL_FIND, JOB_EMAIL_VERIFY, JOB_TECH];

export const ACTIONS: Action[] = [
  { id: "company", title: "Enrich this company", hint: "Name, industry, size, country and LinkedIn from the domain.", jobs: [JOB_COMPANY] },
  { id: "email", title: "Find work email", hint: "A person's work address at this domain, then a deliverability check.", jobs: [JOB_EMAIL_FIND, JOB_EMAIL_VERIFY] },
  { id: "tech", title: "Tech stack", hint: "The technologies this company's website uses.", jobs: [JOB_TECH] },
];

/** A new idempotency key for one confirmed step. */
export function newKey(job: string, uuid: () => string = () => crypto.randomUUID()): string {
  return `chrome-${job}-${uuid()}`;
}
