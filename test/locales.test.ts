import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getterFrom } from "../src/lib/i18n";

type Messages = Record<string, { message: string; placeholders?: Record<string, { content: string }> }>;
const load = (lang: string): Messages => JSON.parse(readFileSync(`public/_locales/${lang}/messages.json`, "utf8"));
const LANGS = readdirSync("public/_locales").sort();
const en = load("en");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
}

describe("locales", () => {
  it("ships the seven store languages", () => {
    expect(LANGS).toEqual(["de", "en", "es", "fr", "it", "nl", "pt"]);
  });

  it("has every English key in every language, with the same placeholders", () => {
    for (const lang of LANGS) {
      const m = load(lang);
      expect(Object.keys(m).sort(), lang).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) {
        expect(Object.keys(m[key]!.placeholders ?? {}).sort(), `${lang}.${key}`).toEqual(Object.keys(value.placeholders ?? {}).sort());
      }
    }
  });

  it("fits the store limits in every language", () => {
    for (const lang of LANGS) {
      const m = load(lang);
      expect([...m.extName!.message].length, lang).toBeLessThanOrEqual(75);
      expect([...m.extDescription!.message].length, lang).toBeLessThanOrEqual(132);
      expect(m.extName!.message.startsWith("Whozit"), lang).toBe(true);
    }
  });

  it("defines every key the code and page ask for", () => {
    const code = sources("src").map((f) => readFileSync(f, "utf8")).join("\n") + readFileSync("public/sidepanel.html", "utf8");
    const used = new Set([...code.matchAll(/\bt\("([A-Za-z0-9_]+)"/g), ...code.matchAll(/data-i18n(?:-label)?="([A-Za-z0-9_]+)"/g), ...code.matchAll(/"(field[A-Z][A-Za-z]+)"/g)].map((m) => m[1]!));
    for (const a of ["actionCompany", "actionWhois", "actionTech", "actionTraffic", "actionSeo", "actionNews", "actionLinkedin", "actionEmail", "actionVerify"]) used.add(`${a}Title`).add(`${a}Hint`);
    for (const id of ["company", "whois", "tech", "traffic", "seo", "news", "linkedin", "email", "verify"]) used.add(`running_${id}`);
    for (const k of ["kindCompany", "kindTeam", "kindArticle", "kindLinkedinPerson", "kindLinkedinCompany", "kindNone", "fieldQuery", "fieldProfileUrl", "fieldEmail", "firstName", "lastName"]) used.add(k);
    for (const s of ["valid", "invalid", "catchall", "risky", "unknown"]) used.add(`status_${s}`);
    for (let i = 1; i <= 6; i++) used.add(`suggest${i}`);
    for (const key of used) expect(en[key], key).toBeDefined();
  });

  it("fills placeholders and dollar signs the way Chrome does", () => {
    const fr = getterFrom(load("fr"));
    expect(fr("fromPerCall", ["$0.0019"])).toBe("dès $0.0019 par appel");
    expect(getterFrom(en)("failedFree")).toBe("A failed call costs $0.");
    expect(getterFrom(en)("errSessionCap", ["$0.10", "$0.05", "$1.00"])).toContain("up to $0.10 and only $0.05 is left under your $1.00 session cap");
  });

  it("uses no em or en dashes", () => {
    for (const lang of LANGS) expect(JSON.stringify(load(lang)), lang).not.toMatch(/[–—]/);
  });
});
