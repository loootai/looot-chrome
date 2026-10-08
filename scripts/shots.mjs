// Renders the store kit: five 1280x800 screenshots, the 440x280 tile and the 1400x560 marquee.
// The panel inside each image is the built dist/sidepanel.html with chrome.* mocked. Prices and
// catalog rows come from the live free API at render time. Run answers are fixtures (no paid
// run is made) for a made-up company on a reserved .example domain.
// Usage: npm run build && PW_CORE=... PW_CHROMIUM=... node scripts/shots.mjs
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium, serve } from "./pw.mjs";

const SITE = "haldencycles.example";
const root = mkdtempSync(join(tmpdir(), "looot-shots-"));
cpSync("dist", join(root, "dist"), { recursive: true });
cpSync("store/src/compose.html", join(root, "compose.html"));
mkdirSync(join(root, "brand"));
cpSync("public/brand/looot-wordmark.png", join(root, "brand/wordmark.png"));
cpSync("public/brand/looot-wordmark-white.png", join(root, "brand/wordmark-white.png"));

const RUNS = {
  "job:company.enrich": { actualCost: 0.0019, result: { name: "Halden Cycles", industry: "Sporting goods", employees: 84, founded: 2014, country: "Norway", city: "Bergen", linkedin_url: "linkedin.com/company/halden-cycles", description: "Steel touring and gravel bikes, built to order in Bergen." } },
  "job:people.email.find": { actualCost: 0.003598, result: { email: `ingrid.solberg@${SITE}` } },
  "job:people.email.verify": { actualCost: 0.00145, result: { status: "valid" } },
  "job:company.technographics": { actualCost: 0.01, result: { technologies: ["Shopify", "Klaviyo", "Cloudflare", "Google Analytics 4", "Stripe", "Sanity", "Next.js", "Vercel", "Zendesk", "Hotjar", "Meta Pixel", "Algolia"].map((name) => ({ name })) } },
};

// Runs in every frame before the page scripts. Only the panel iframe (it has ?scene=) is mocked.
function mockChrome(site) {
  const scene = new URLSearchParams(location.search).get("scene");
  if (!scene) return;
  const area = (data) => ({
    get: async (keys) => Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]])),
    set: async (items) => { Object.assign(data, items); },
    remove: async (keys) => { for (const k of keys) delete data[k]; },
  });
  const noToken = scene === "catalog";
  const sessionData = scene === "settings" ? { spend: { spent: 0.016948, reserved: 0, runs: 4 } } : {};
  const listener = { addListener() {} };
  window.chrome = {
    storage: { local: area(noToken ? {} : { token: "cs_ms_demo" }), session: area(sessionData) },
    tabs: { query: async () => [{ url: `https://www.${site}/bikes` }], onActivated: listener, onUpdated: listener },
    runtime: { onMessage: listener, sendMessage: async () => undefined },
  };
}

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };

const pw = await chromium();
const server = await serve(root);
const browser = await pw.chromium.launch({ executablePath: pw.executablePath, headless: true });
mkdirSync("store/screenshots", { recursive: true });

async function open(params, viewport, dark = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: dark ? "dark" : "light" });
  await context.addInitScript(mockChrome, SITE);
  await context.route("https://api.looot.ai/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/v1/balance") return route.fulfill({ json: { available: 4.87 }, headers: cors });
    if (url.pathname === "/v1/runs") {
      const body = req.postDataJSON();
      await new Promise((r) => setTimeout(r, 250));
      return route.fulfill({ json: { runId: "run_demo", status: "completed", ...RUNS[body.endpointId] }, headers: cors });
    }
    // Free public reads: real data from the live API.
    const live = await fetch(url, { headers: { accept: "application/json" } });
    return route.fulfill({ status: live.status, body: await live.text(), contentType: "application/json", headers: cors });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`pageerror: ${e.message}`));
  await page.goto(`${server.url}/compose.html?${new URLSearchParams(params)}`);
  const panel = page.frameLocator("iframe");
  return { context, page, panel };
}

const SHOTS = [
  {
    file: "1-catalog-search.png",
    params: { scene: "catalog", url: `${SITE}/bikes`, h: "Search 2,500+ data APIs", p: "Free, no account. Every endpoint shows what one call costs.", f1: "90+", l1: "providers, one catalog", f2: "$0", l2: "to search" },
    drive: async (panel) => {
      await panel.locator("#tab-catalog").click();
      await panel.locator("#catalog-q").fill("verify email");
      await panel.locator(".results .result-row:not(.skeleton-row)").first().waitFor();
    },
  },
  {
    file: "2-price-before-run.png",
    params: { scene: "confirm", url: `${SITE}/bikes`, h: "See the price before anything runs", p: "Each lookup shows its listed price and the most it can charge. Nothing runs until you confirm.", f1: "1 click", l1: "to confirm a paid call", f2: "$0", l2: "for a failed call" },
    drive: async (panel) => {
      await panel.locator("#action-company .price:not(.skeleton)").waitFor();
      await panel.locator("#action-company button", { hasText: "See price" }).click();
      await panel.locator("#action-company .confirm").waitFor();
    },
  },
  {
    file: "3-company-enriched.png",
    params: { scene: "company", url: `${SITE}/bikes`, h: "Enrich the company you are looking at", p: "Name, industry, size, country and LinkedIn from the tab's domain. The receipt shows what was charged.", f1: "21", l1: "providers behind one job", f2: "$0.0019", l2: "cheapest listed call" },
    drive: async (panel) => {
      await panel.locator("#action-company .price:not(.skeleton)").waitFor();
      await panel.locator("#action-company button", { hasText: "See price" }).click();
      await panel.locator("#action-company button", { hasText: "Confirm and run" }).click();
      await panel.locator("#action-company .receipt").waitFor();
    },
  },
  {
    file: "4-work-email.png",
    params: { scene: "email", url: `${SITE}/team`, h: "Find a work email, then check it", p: "Type a name. looot finds the address at this domain and verifies it, each step under your cap.", f1: "2 steps", l1: "find, then verify", f2: "$0.05", l2: "default cap per call" },
    drive: async (panel) => {
      await panel.locator("#action-email .price:not(.skeleton)").waitFor();
      await panel.locator("#first-name").fill("Ingrid");
      await panel.locator("#last-name").fill("Solberg");
      await panel.locator("#action-email button", { hasText: "See price" }).click();
      await panel.locator("#action-email button", { hasText: "Confirm and run" }).click();
      await panel.locator("#action-email .receipt").waitFor();
      await panel.locator("#action-email").evaluate((el) => el.scrollIntoView({ block: "start" }));
    },
    keepScroll: true,
  },
  {
    file: "5-limits-and-token.png",
    dark: true,
    params: { scene: "settings", dark: "1", url: `${SITE}/bikes`, h: "Your token, your limits", p: "The token stays in this browser. Set a cap per call and a cap per session. The counter is always on screen.", f1: "0", l1: "analytics or trackers", f2: "1 host", l2: "api.looot.ai only" },
    drive: async (panel) => {
      await panel.locator("#tab-settings").click();
      await panel.locator("#session-cap").waitFor();
    },
  },
];

for (const shot of SHOTS) {
  const { context, page, panel } = await open({ kind: "shot", ...shot.params }, { width: 1280, height: 800 }, shot.dark);
  await shot.drive(panel);
  if (!shot.keepScroll) await panel.locator("main").evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve("store/screenshots", shot.file) });
  await context.close();
  console.log(`store/screenshots/${shot.file}`);
}

for (const [kind, viewport, file] of [["small", { width: 440, height: 280 }, "promo-small-440x280.png"], ["marquee", { width: 1400, height: 560 }, "promo-marquee-1400x560.png"]]) {
  const { context, page, panel } = await open({ kind, scene: "company" }, viewport);
  if (kind === "marquee") {
    await panel.locator("#action-company .price:not(.skeleton)").waitFor();
    await panel.locator("#action-company button", { hasText: "See price" }).click();
    await panel.locator("#action-company button", { hasText: "Confirm and run" }).click();
    await panel.locator("#action-company .receipt").waitFor();
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve("store", file) });
  await context.close();
  console.log(`store/${file}`);
}

await browser.close();
server.close();
rmSync(root, { recursive: true, force: true });
