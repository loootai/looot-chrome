import { describe, expect, it } from "vitest";
import { actionsFor, missing, ACTIONS } from "../src/lib/actions";
import { detectPage, nameFromLinkedInTitle } from "../src/lib/page";
import { readLinkedIn, readNews } from "../src/lib/read";

describe("detectPage", () => {
  it("tells page kinds apart from the URL", () => {
    expect(detectPage("https://www.stripe.com/pricing").kind).toBe("company");
    expect(detectPage("https://linear.app/about").kind).toBe("team");
    expect(detectPage("https://vercel.com/team").kind).toBe("team");
    expect(detectPage("https://stripe.com/blog/new-dashboard").kind).toBe("article");
    expect(detectPage("https://techcrunch.com/2026/10/31/some-story/").kind).toBe("article");
    expect(detectPage("chrome://newtab").kind).toBe("none");
    expect(detectPage("https://www.linkedin.com/feed/").kind).toBe("none");
  });
  it("reads LinkedIn profiles and company pages, with the name from the title", () => {
    const p = detectPage("https://www.linkedin.com/in/ada-lovelace-123/?trk=x", "(3) Ada Lovelace - Analyst at Engines | LinkedIn");
    expect(p).toEqual({ kind: "linkedinPerson", domain: null, linkedinUrl: "https://www.linkedin.com/in/ada-lovelace-123", name: "Ada Lovelace" });
    const c = detectPage("https://fr.linkedin.com/company/stripe/about/", "Stripe | LinkedIn");
    expect(c).toMatchObject({ kind: "linkedinCompany", linkedinUrl: "https://www.linkedin.com/company/stripe", name: "Stripe" });
    expect(nameFromLinkedInTitle(undefined)).toBe("");
  });
});

describe("actionsFor", () => {
  const ids = (url: string, title?: string) => actionsFor(detectPage(url, title)).map((a) => a.id);
  it("puts company lookups first on a company site", () => {
    expect(ids("https://stripe.com/")).toEqual(["company", "tech", "traffic", "seo", "whois", "news", "email", "verify", "linkedin"]);
  });
  it("puts people lookups first on a team page", () => {
    expect(ids("https://stripe.com/about").slice(0, 3)).toEqual(["email", "verify", "linkedin"]);
  });
  it("offers only LinkedIn-based lookups on LinkedIn, never domain lookups on linkedin.com", () => {
    expect(ids("https://www.linkedin.com/in/ada", "Ada Lovelace | LinkedIn")).toEqual(["linkedin", "email", "verify", "news"]);
    expect(ids("https://www.linkedin.com/company/stripe", "Stripe | LinkedIn")).toEqual(["company", "news", "verify"]);
  });
  it("still offers lookups with typed input on a browser page", () => {
    expect(ids("chrome://newtab")).toEqual(["verify", "linkedin", "news"]);
  });
  it("builds each job's input from the page and the form", () => {
    const by = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));
    const person = detectPage("https://www.linkedin.com/in/ada", "Ada Lovelace | LinkedIn");
    expect(by.email!.input(person, {})).toEqual({ linkedin_url: "https://www.linkedin.com/in/ada" });
    expect(by.email!.fields(person)).toEqual([]);
    const site = detectPage("https://stripe.com/");
    expect(by.email!.input(site, { first: "Ada", last: "Lovelace" })).toEqual({ first_name: "Ada", last_name: "Lovelace", domain: "stripe.com" });
    expect(missing(by.email!, site, { first: "Ada" })).toEqual(["last"]);
    expect(by.company!.input(detectPage("https://www.linkedin.com/company/stripe"), {})).toEqual({ linkedin_url: "https://www.linkedin.com/company/stripe" });
    expect(by.news!.fields(person)[0]!.prefill!(person)).toBe("Ada Lovelace");
    expect(by.news!.fields(site)[0]!.prefill!(site)).toBe("stripe.com");
  });
});

describe("people and news readers", () => {
  // Trimmed copies of real answers from looot runs, 2026-11-01.
  const PROFILE = { status: "completed", result: { items: 1, source: { name: "Mongoose" }, output: { found: true, data: {
    name: "Bill Gates", headline: "Chair, Gates Foundation and Founder, Breakthrough Energy", location: "Seattle, Washington, United States",
    followers: 40771173, currentPosition: [{ position: "Co-chair", companyName: "Gates Foundation" }], education: [{ school: "Harvard University" }],
    about: "Chair of the Gates Foundation." } } } };
  const NEWS = { status: "completed", result: { items: 10, output: { data: { items: [
    { url: "https://example.com/a", title: "Stripe users can now pay with crypto", source: "Yahoo Finance", createdUtc: 1767772800 },
    { url: "javascript:alert(1)", title: "bad link", source: "x" },
    { url: "https://example.org/b", title: "What is Stripe", source: "NerdWallet" },
  ] } } } };
  it("reads a LinkedIn profile, not the wrapper's name", () => {
    const card = readLinkedIn(PROFILE, "en-US");
    expect(card.name).toBe("Bill Gates");
    expect(card.fields).toEqual([
      { label: "fieldHeadline", value: "Chair, Gates Foundation and Founder, Breakthrough Energy" },
      { label: "fieldRole", value: "Co-chair, Gates Foundation" },
      { label: "fieldLocation", value: "Seattle, Washington, United States" },
      { label: "fieldFollowers", value: "40.8M" },
      { label: "fieldSchool", value: "Harvard University" },
      { label: "fieldAbout", value: "Chair of the Gates Foundation." },
    ]);
  });
  it("keeps only news items with an http link", () => {
    expect(readNews(NEWS)).toEqual([
      { title: "Stripe users can now pay with crypto", source: "Yahoo Finance", url: "https://example.com/a", date: "2026-01-07" },
      { title: "What is Stripe", source: "NerdWallet", url: "https://example.org/b", date: "" },
    ]);
  });
});
