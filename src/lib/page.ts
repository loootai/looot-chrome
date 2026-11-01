// Works out what kind of page the tab shows from its URL and title only. No script runs in the
// page, so this needs no permission beyond activeTab.

import { domainFromUrl } from "./domain";

export type PageKind = "company" | "team" | "article" | "linkedinPerson" | "linkedinCompany" | "none";

export interface Page {
  kind: PageKind;
  /** The site's domain, or null on LinkedIn and browser pages. */
  domain: string | null;
  /** Canonical LinkedIn URL for a profile or company page. */
  linkedinUrl: string | null;
  /** Person or company name read from the tab title, when there is one. */
  name: string;
}

const TEAM_PATH = /\/(team|our-team|people|leadership|about|about-us|company|staff|founders|management|who-we-are)(\/|$)/i;
const ARTICLE_PATH = /\/(blog|news|article|articles|posts?|press|stories|insights|magazine)\/[^/]+|\/\d{4}\/\d{2}\//i;

/** "Ada Lovelace - Analyst at X | LinkedIn" and "(3) Ada Lovelace | LinkedIn" both give "Ada Lovelace". */
export function nameFromLinkedInTitle(title: string | undefined | null): string {
  if (!title) return "";
  const head = title.replace(/^\(\d+\)\s*/, "").split(/\s+\|\s+LinkedIn/i)[0] ?? "";
  return head.split(/\s+[-\u2013]\s+/)[0]!.trim().slice(0, 80);
}

export function detectPage(url: string | undefined | null, title?: string | null): Page {
  const none: Page = { kind: "none", domain: null, linkedinUrl: null, name: "" };
  if (!url) return none;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return none;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    const m = u.pathname.match(/^\/(in|company)\/([^/?#]+)/i);
    if (!m) return none;
    const kind = m[1]!.toLowerCase() === "in" ? "linkedinPerson" : "linkedinCompany";
    return { kind, domain: null, linkedinUrl: `https://www.linkedin.com/${m[1]!.toLowerCase()}/${m[2]}`, name: nameFromLinkedInTitle(title) };
  }
  const domain = domainFromUrl(url);
  if (!domain) return none;
  const kind: PageKind = ARTICLE_PATH.test(u.pathname) ? "article" : TEAM_PATH.test(u.pathname) ? "team" : "company";
  return { kind, domain, linkedinUrl: null, name: "" };
}
