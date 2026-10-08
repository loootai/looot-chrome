import { describe, expect, it } from "vitest";
import { ACTIONS, ALL_JOBS, newKey } from "../src/lib/actions";
import { domainFromInput, domainFromUrl } from "../src/lib/domain";
import { itemPrice, jobFrom, parseUsd, usd } from "../src/lib/format";
import { readCompany, readEmail, readStatus, readTechnologies } from "../src/lib/read";
import { canSpend, EMPTY_SPEND, left, reserve, settle } from "../src/lib/spend";
import { DEFAULTS, loadSettings, loadSpend, saveToken, type Area } from "../src/lib/store";

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
      { label: "Name", value: "Linear" },
      { label: "Industry", value: "Software" },
      { label: "Employees", value: "120" },
      { label: "LinkedIn", value: "https://www.linkedin.com/company/linearapp" },
    ]);
  });
  it("collects technology names from common shapes", () => {
    expect(readTechnologies({ status: "completed", result: { technologies: [{ name: "React" }, { name: "Stripe" }, { name: "React" }] } })).toEqual(["React", "Stripe"]);
    expect(readTechnologies({ status: "completed", result: { data: { tech_stack: ["Next.js", "Vercel"] } } })).toEqual(["Next.js", "Vercel"]);
    expect(readTechnologies({ status: "completed", result: { groups: [{ name: "analytics", live: 3 }] } })).toEqual([]);
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
  it("uses the four job ids listed in the catalog", () => {
    expect(ALL_JOBS).toEqual(["company.enrich", "people.email.find", "people.email.verify", "company.technographics"]);
    expect(ACTIONS.map((a) => a.jobs)).toEqual([["company.enrich"], ["people.email.find", "people.email.verify"], ["company.technographics"]]);
  });
  it("makes a new idempotency key per confirmed step", () => {
    const a = newKey("company.enrich");
    const b = newKey("company.enrich");
    expect(a).toMatch(/^chrome-company\.enrich-[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
});
