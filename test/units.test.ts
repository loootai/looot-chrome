import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { ACTIONS, ALL_JOBS, newKey } from "../src/lib/actions";
import { getterFrom, setGetter } from "../src/lib/i18n";
import { domainFromInput, domainFromUrl } from "../src/lib/domain";
import { itemPrice, jobFrom, parseUsd, usd } from "../src/lib/format";
import { readCompany, readEmail, readSeo, readStatus, readTechnologies, readTraffic, readWhois } from "../src/lib/read";
import { canSpend, EMPTY_SPEND, left, reserve, settle } from "../src/lib/spend";
import { DEFAULTS, loadSettings, loadSpend, saveToken, type Area } from "../src/lib/store";

beforeAll(() => setGetter(getterFrom(JSON.parse(readFileSync("public/_locales/en/messages.json", "utf8")))));

function area(initial: Record<string, unknown> = {}): Area & { data: Record<string, unknown> } {
  const data = { ...initial };
  return {
    data,
    get: async (keys) => Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]])),
    set: async (items) => { Object.assign(data, items); },
    remove: async (keys) => { for (const k of keys) delete data[k]; },
  };
}

describe("domain", () => {
  it("reads the company domain from a tab URL", () => {
    expect(domainFromUrl("https://www.stripe.com/pricing?x=1")).toBe("stripe.com");
    expect(domainFromUrl("http://docs.example.co.uk/")).toBe("docs.example.co.uk");
  });
  it("gives null for pages with no company site", () => {
    for (const u of ["chrome://extensions", "about:blank", "file:///tmp/a.html", "http://localhost:3000", "http://192.168.1.4/", undefined, ""]) {
      expect(domainFromUrl(u)).toBeNull();
    }
  });
  it("accepts typed domains and pasted URLs", () => {
    expect(domainFromInput(" WWW.Linear.app ")).toBe("linear.app");
    expect(domainFromInput("https://vercel.com/pricing")).toBe("vercel.com");
    expect(domainFromInput("notion.so/product")).toBe("notion.so");
    expect(domainFromInput("not a domain")).toBeNull();
    expect(domainFromInput("")).toBeNull();
  });
});

describe("format", () => {
  it("keeps sub-cent prices readable", () => {
    expect(usd(0)).toBe("$0");
    expect(usd(0.0019)).toBe("$0.0019");
    expect(usd(0.003598)).toBe("$0.003598");
    expect(usd(0.05)).toBe("$0.05");
    expect(usd(0.0519)).toBe("$0.0519");
    expect(usd(1.2)).toBe("$1.20");
    expect(usd(null)).toBe("n/a");
  });
  it("labels catalog item prices by unit", () => {
    expect(itemPrice({ state: "known", amountMicros: 4830, unit: "call" })).toBe("$0.00483 per call");
    expect(itemPrice({ state: "known", amountMicros: 10000, unit: "result" })).toBe("$0.01 per result");
    expect(itemPrice({ state: "known", amountMicros: 0, unit: "call" })).toBe("free per call");
    expect(itemPrice({ state: "unknown", amountMicros: null })).toBe("price not listed");
    expect(itemPrice(null)).toBe("price not listed");
  });
  it("labels job prices without calling a paid job free", () => {
    expect(jobFrom({ cheapestPerCall: 0.0019, cheapestPerResult: 0.00145 })).toBe("from $0.0019 per call");
    expect(jobFrom({ cheapestPerCall: 0, cheapestPerResult: 0.01 })).toBe("free with one provider, others from $0.01 per result");
    expect(jobFrom({ cheapestPerCall: null, cheapestPerResult: 0.004 })).toBe("from $0.004 per result");
    expect(jobFrom(undefined)).toBe("price loading");
  });
  it("parses dollar fields", () => {
    expect(parseUsd("$0.50")).toBe(0.5);
    expect(parseUsd("0,05")).toBe(0.05);
    expect(parseUsd("0")).toBeNull();
    expect(parseUsd("abc")).toBeNull();
  });
});

describe("spend", () => {
  it("allows a call that lands exactly on the cap and blocks one cent more", () => {
    const s = { spent: 0.45, reserved: 0, runs: 9 };
    expect(canSpend(s, 0.5, 0.05)).toBe(true);
    expect(canSpend(s, 0.5, 0.06)).toBe(false);
    expect(left(s, 0.5)).toBe(0.05);
  });
  it("counts reservations against the cap", () => {
    const s = reserve(EMPTY_SPEND, 0.05);
    expect(canSpend(s, 0.08, 0.05)).toBe(false);
    expect(settle(s, 0.05, 0.0019)).toEqual({ spent: 0.0019, reserved: 0, runs: 1 });
    expect(settle(s, 0.05, null)).toEqual({ spent: 0.05, reserved: 0, runs: 1 });
  });
});

describe("readers", () => {
  it("prefers the normalized block, then searches the raw result", () => {
    expect(readEmail({ status: "completed", normalized: { fields: { email: "ada@example.com" } }, result: {} })).toBe("ada@example.com");
    expect(readEmail({ status: "completed", result: { data: [{ attributes: { value: "Contact: grace@example.org" } }] } })).toBe("grace@example.org");
    expect(readEmail({ status: "completed", result: { data: [] } })).toBe("");
  });
  it("maps provider verdicts to one status word", () => {
    expect(readStatus({ status: "completed", result: { result: "deliverable" } })).toBe("valid");
    expect(readStatus({ status: "completed", result: { data: { status: "accept_all" } } })).toBe("catch-all");
    expect(readStatus({ status: "completed", result: { verdict: "weird" } })).toBe("unknown");
    expect(readStatus({ status: "completed", result: {} })).toBe("");
  });
  it("reads company fields and leaves out the missing ones", () => {
    const fields = readCompany({ status: "completed", result: { company: { name: "Linear", industry: "Software", employee_count: 120, linkedin_url: "https://www.linkedin.com/company/linearapp" } } });
    expect(fields).toEqual([
      { label: "fieldName", value: "Linear" },
      { label: "fieldIndustry", value: "Software" },
      { label: "fieldEmployees", value: "120" },
      { label: "fieldLinkedIn", value: "https://www.linkedin.com/company/linearapp" },
    ]);
  });
  it("collects technology names from common shapes", () => {
    expect(readTechnologies({ status: "completed", result: { technologies: [{ name: "React" }, { name: "Stripe" }, { name: "React" }] } })).toEqual(["React", "Stripe"]);
    expect(readTechnologies({ status: "completed", result: { data: { tech_stack: ["Next.js", "Vercel"] } } })).toEqual(["Next.js", "Vercel"]);
    expect(readTechnologies({ status: "completed", result: { groups: [{ name: "analytics", live: 3 }] } })).toEqual([]);
  });
});

// Trimmed copies of real answers from looot runs on stripe.com, 2026-11-01.
const TRAFFIC = { status: "completed", result: { siteOverview: { category: "finance", globalRank: { rank: 312 }, countryRank: { rank: 226, countryCode: "US" },
  engagements: { visits: "133172721", bounceRate: "0.5545453726745924", timeOnSite: "166.89220074609705", pagePerVisit: "3.2040017972128374" },
  trafficSources: { Mail: 0.0267, Direct: 0.40651, Referrals: 0.38975, SearchOrganic: 0.05956, Affiliate: 0.00074 } } } };
const SEO = { status: "completed", normalized: { fields: { backlinks: 86999019, referringDomains: 494585, rank: 731 } },
  result: { items: [{ rank: 731, backlinks: 86999019, referring_domains: 494585, backlinks_spam_score: 4, first_seen: "2019-01-15 22:55:56 +00:00" }] } };
const WHOIS = { status: "completed", result: { WhoisRecord: { registrarName: "Safenames Ltd.", createdDate: "1995-09-12T04:00:00Z", expiresDate: "2027-09-11T04:00:00Z",
  dataError: "MASKED_WHOIS_DATA", estimatedDomainAge: 11373, nameServers: { hostNames: ["ns-1087.awsdns-07.org", "NS-423.AWSDNS-52.COM"] } } } };

describe("site readers", () => {
  it("reads traffic: visits, ranks, engagement and the top sources", () => {
    const card = readTraffic(TRAFFIC, "en-US");
    expect(card.fields).toEqual([
      { label: "fieldVisits", value: "133.2M" },
      { label: "fieldGlobalRank", value: "#312" },
      { label: "fieldCountryRank", value: "#226 (US)" },
      { label: "fieldCategory", value: "finance" },
      { label: "fieldBounce", value: "55%" },
      { label: "fieldPagesPerVisit", value: "3.2" },
      { label: "fieldTimeOnSite", value: "2:47" },
    ]);
    expect(card.chips).toEqual(["Direct 41%", "Referrals 39%", "Search Organic 6%", "Mail 3%", "Affiliate 0%"]);
  });
  it("reads SEO numbers from the normalized block", () => {
    expect(readSeo(SEO, "en-US").fields).toEqual([
      { label: "fieldDomainRank", value: "731" },
      { label: "fieldBacklinks", value: "87M" },
      { label: "fieldRefDomains", value: "494.6K" },
      { label: "fieldSpamScore", value: "4" },
      { label: "fieldFirstSeen", value: "2019-01-15" },
    ]);
  });
  it("reads WHOIS and flags a redacted owner", () => {
    const card = readWhois(WHOIS);
    expect(card.fields).toEqual([
      { label: "fieldRegistrar", value: "Safenames Ltd." },
      { label: "fieldCreated", value: "1995-09-12" },
      { label: "fieldExpires", value: "2027-09-11" },
      { label: "fieldAgeYears", value: "31" },
    ]);
    expect(card.chips).toEqual(["ns-1087.awsdns-07.org", "ns-423.awsdns-52.com"]);
    expect(card.redacted).toBe(true);
  });
  it("returns empty cards for empty answers", () => {
    expect(readTraffic({ status: "completed", result: {} }).fields).toEqual([]);
    expect(readSeo({ status: "completed", result: {} }).fields).toEqual([]);
    expect(readWhois({ status: "completed", result: {} }).fields).toEqual([]);
  });
});

describe("store", () => {
  it("returns defaults on a fresh install", async () => {
    expect(await loadSettings(area())).toEqual(DEFAULTS);
  });
  it("saves a trimmed token and removes it on empty", async () => {
    const local = area();
    await saveToken(local, "  cs_ms_abc  ");
    expect(local.data.token).toBe("cs_ms_abc");
    await saveToken(local, "");
    expect("token" in local.data).toBe(false);
  });
  it("counts a reservation left by a closed panel as spent", async () => {
    expect(await loadSpend(area({ spend: { spent: 0.01, reserved: 0.05, runs: 2 } }))).toEqual({ spent: 0.06, reserved: 0, runs: 2 });
  });
});

describe("actions", () => {
  it("uses the nine job ids listed in the catalog", () => {
    expect(ALL_JOBS).toEqual(["company.enrich", "domain.whois.lookup", "company.technographics", "company.traffic", "backlinks.domain.summary", "news.search", "linkedin.person.profile", "people.email.find", "people.email.verify"]);
    expect(ACTIONS.map((a) => a.id)).toEqual(["company", "whois", "tech", "traffic", "seo", "news", "linkedin", "email", "verify"]);
  });
  it("makes a new idempotency key per confirmed step", () => {
    const a = newKey("company.enrich");
    const b = newKey("company.enrich");
    expect(a).toMatch(/^chrome-company\.enrich-[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
});
