import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
}

describe("manifest", () => {
  it("is Manifest V3 with the minimum permissions", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(["sidePanel", "storage", "activeTab"]);
    expect(manifest.host_permissions).toEqual(["https://api.looot.ai/*"]);
    expect(manifest.optional_permissions).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });
  it("reads name and description from _locales and matches package.json", () => {
    expect(manifest.name).toBe("__MSG_extName__");
    expect(manifest.description).toBe("__MSG_extDescription__");
    expect(manifest.default_locale).toBe("en");
    expect(manifest.version).toBe(pkg.version);
  });
  it("allows connections to api.looot.ai only and no remote scripts", () => {
    const csp: string = manifest.content_security_policy.extension_pages;
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src https://api.looot.ai");
    expect(csp).not.toMatch(/unsafe|\*/);
  });
});

describe("source", () => {
  const files = sources("src").map((f) => [f, readFileSync(f, "utf8")] as const);
  it("never logs, evaluates strings or uses synced storage", () => {
    for (const [file, text] of files) {
      expect(text, file).not.toMatch(/console\.|\beval\(|new Function\(|innerHTML|storage\.sync/);
    }
  });
  it("names no host other than looot's", () => {
    for (const [file, text] of files) {
      const hosts = [...text.matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]!);
      for (const host of hosts) expect(["api.looot.ai", "looot.ai", "docs.looot.ai", "github.com", "www.w3.org", "example.com", "www.example.com"], `${file}: ${host}`).toContain(host);
    }
  });
});
