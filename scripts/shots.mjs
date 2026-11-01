// Renders the store kit from the built panel: five 1280x800 English screenshots, one localized
// 1280x800 screenshot per other language, the 440x280 tile, the 1400x560 marquee and a demo
// video (WebM from Playwright, converted to MP4 by ffmpeg when it is on PATH).
// The panel inside each image is dist/sidepanel.html with chrome.* mocked. Prices and catalog rows
// come from the live free API at render time. Run answers are fixtures (no paid run is made) for a
// made-up company on a reserved .example domain, and every frame carries a "Demo data" label.
// Usage: npm run build && PW_CORE=... PW_CHROMIUM=... node scripts/shots.mjs [--no-video]
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
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

const MESSAGES = Object.fromEntries(readdirSync("public/_locales").map((l) => [l, JSON.parse(readFileSync(`public/_locales/${l}/messages.json`, "utf8"))]));

const RUNS = {
  "job:company.enrich": { actualCost: 0.0019, result: { name: "Halden Cycles", industry: "Sporting goods", employees: 84, founded: 2014, country: "Norway", city: "Bergen", linkedin_url: "linkedin.com/company/halden-cycles", description: "Steel touring and gravel bikes, built to order in Bergen." } },
  "job:domain.whois.lookup": { actualCost: 0.025, result: { WhoisRecord: { registrarName: "Example Registrar AS", createdDate: "2013-04-02T09:12:00Z", expiresDate: "2027-04-02T09:12:00Z", estimatedDomainAge: 4596, dataError: "MASKED_WHOIS_DATA", nameServers: { hostNames: ["ns1.example-dns.net", "ns2.example-dns.net"] } } } },
  "job:company.technographics": { actualCost: 0.01, result: { technologies: ["Shopify", "Klaviyo", "Cloudflare", "Google Analytics 4", "Stripe", "Sanity", "Next.js", "Vercel", "Zendesk", "Hotjar", "Meta Pixel", "Algolia"].map((name) => ({ name })) } },
  "job:company.traffic": { actualCost: 0.06532, result: { siteOverview: { category: "sports", globalRank: { rank: 184210 }, countryRank: { rank: 2140, countryCode: "NO" }, engagements: { visits: "61400", bounceRate: "0.41", timeOnSite: "204", pagePerVisit: "4.1" }, trafficSources: { SearchOrganic: 0.46, Direct: 0.29, SocialOrganic: 0.11, Referrals: 0.08, Mail: 0.04, SearchPaid: 0.02 } } } },
  "job:backlinks.domain.summary": { actualCost: 0.024, normalized: { fields: { rank: 212, backlinks: 18400, referringDomains: 1310 } }, result: { items: [{ backlinks_spam_score: 2, first_seen: "2014-06-20 10:00:00 +00:00" }] } },
  "job:people.email.find": { actualCost: 0.003598, result: { email: `ingrid.solberg@${SITE}` } },
  "job:people.email.verify": { actualCost: 0.00145, result: { status: "valid" } },
};

// Live listed prices, so every price on the images is one looot shows.
const overview = await (await fetch("https://api.looot.ai/v1/catalog/overview?depth=jobs", { headers: { accept: "application/json" } })).json();
const PRICE = {};
for (const c of overview.categories ?? []) for (const p of c.platforms ?? []) for (const j of p.jobs ?? []) if (!(j.id in PRICE)) PRICE[j.id] = j.cheapestPerCall;
const money = (n) => `$${Number(n.toFixed(6))}`;
console.log(`live prices: company ${PRICE["company.enrich"]}, traffic ${PRICE["company.traffic"]}, tech ${PRICE["company.technographics"]}, seo ${PRICE["backlinks.domain.summary"]}, email ${PRICE["people.email.find"]}`);

// Runs in every frame before the page scripts. Only the panel iframe (it has ?scene=) is mocked.
function mockChrome({ site, messages, lang }) {
  const scene = new URLSearchParams(location.search).get("scene");
  if (!scene) return;
  const area = (data) => ({
    get: async (keys) => Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]])),
    set: async (items) => { Object.assign(data, items); },
    remove: async (keys) => { for (const k of keys) delete data[k]; },
  });
  const getMessage = (key, subs = []) => {
    const m = messages[key];
    if (!m) return "";
    let text = m.message;
    for (const [name, p] of Object.entries(m.placeholders ?? {})) text = text.replace(new RegExp(`\\$${name}\\$`, "gi"), p.content);
    return text.replace(/\$\$|\$(\d)/g, (all, n) => (n ? subs[Number(n) - 1] ?? "" : "$"));
  };
  const noToken = scene === "catalog";
  const sessionData = scene === "settings" ? { spend: { spent: 0.016948, reserved: 0, runs: 4 } } : {};
  const listener = { addListener() {} };
  window.chrome = {
    storage: { local: area(noToken ? {} : { token: "cs_ms_demo" }), session: area(sessionData) },
    tabs: { query: async () => [{ url: `https://www.${site}/bikes` }], onActivated: listener, onUpdated: listener },
    runtime: { onMessage: listener, sendMessage: async () => undefined },
    i18n: { getMessage, getUILanguage: () => lang },
  };
}

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
const pw = await chromium();
const server = await serve(root);
const browser = await pw.chromium.launch({ executablePath: pw.executablePath, headless: true });
mkdirSync("store/screenshots", { recursive: true });

async function open(params, viewport, { dark = false, lang = "en", video } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: dark ? "dark" : "light", recordVideo: video ? { dir: video, size: viewport } : undefined });
  await context.addInitScript(mockChrome, { site: SITE, messages: MESSAGES[lang], lang });
  await context.route("https://api.looot.ai/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/v1/balance") return route.fulfill({ json: { available: 4.87 }, headers: cors });
    if (url.pathname === "/v1/runs") {
      const body = req.postDataJSON();
      await new Promise((r) => setTimeout(r, video ? 900 : 250));
      return route.fulfill({ json: { runId: "run_demo", status: "completed", route: { servedBy: "demo data" }, ...RUNS[body.endpointId] }, headers: cors });
    }
    const live = await fetch(url, { headers: { accept: "application/json" } });
    return route.fulfill({ status: live.status, body: await live.text(), contentType: "application/json", headers: cors });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`pageerror: ${e.message}`));
  await page.goto(`${server.url}/compose.html?${new URLSearchParams(params)}`);
  const panel = page.frameLocator("iframe");
  return { context, page, panel };
}

const top = (panel, sel) => panel.locator(sel).evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));

async function run(panel, id, pause = 0) {
  const wait = () => new Promise((r) => setTimeout(r, pause));
  await panel.locator(`#action-${id} .price:not(.skeleton)`).waitFor();
  await top(panel, `#action-${id}`);
  await wait();
  await panel.locator(`#action-${id} button.btn`).first().click();
  await panel.locator(`#action-${id} .confirm`).waitFor();
  await wait();
  await panel.locator(`#action-${id} .btn.primary`).click();
  await panel.locator(`#action-${id} .receipt`).waitFor();
  await top(panel, `#action-${id}`);
}

const url = `www.${SITE}/bikes`;
const SHOTS = [
  {
    file: "1-who-owns-this-website.png",
    params: { scene: "company", url, h: "Who owns this website?", p: "Open the panel on any site. One click shows the company behind it: name, industry, size, country, LinkedIn.", f1: money(PRICE["company.enrich"]), l1: "cheapest listed call", f2: "$0", l2: "for a failed call" },
    drive: (panel) => run(panel, "company"),
  },
  {
    file: "2-website-traffic-checker.png",
    params: { scene: "traffic", url, h: "Website traffic checker", p: "Estimated monthly visits, global and country rank, bounce rate and where the traffic comes from.", f1: money(PRICE["company.traffic"]), l1: "listed price per call", f2: "$0", l2: "for a failed call" },
    drive: (panel) => run(panel, "traffic"),
  },
  {
    file: "3-tech-stack-detector.png",
    params: { scene: "tech", url, h: "Tech stack detector", p: "See what the site runs on: CMS, analytics, payments, hosting, support tools.", f1: "4,200+", l1: "endpoints in the catalog", f2: "300+", l2: "providers" },
    drive: (panel) => run(panel, "tech"),
  },
  {
    file: "4-price-before-every-call.png",
    params: { scene: "seo", url, h: "The price before every call", p: "Each lookup shows its listed price and the most it can charge. Nothing runs until you confirm. Your key, your caps.", f1: money(PRICE["backlinks.domain.summary"]), l1: "SEO and backlinks, listed", f2: "$5", l2: "smallest top-up, no subscription" },
    drive: async (panel) => {
      await panel.locator("#action-seo .price:not(.skeleton)").waitFor();
      await top(panel, "#action-seo");
      await panel.locator("#action-seo button.btn").first().click();
      await panel.locator("#action-seo .confirm").waitFor();
    },
  },
  {
    file: "5-work-email-finder.png",
    params: { scene: "email", url: `www.${SITE}/team`, h: "Find a work email, then check it", p: "Type a name. looot finds the address at this domain and verifies it, each step under your cap.", f1: money(PRICE["people.email.find"]), l1: "cheapest listed find", f2: "2 steps", l2: "find, then verify" },
    drive: async (panel) => {
      await panel.locator("#action-email .price:not(.skeleton)").waitFor();
      await panel.locator("#first-name").fill("Ingrid");
      await panel.locator("#last-name").fill("Solberg");
      await panel.locator("#action-email button.btn").first().click();
      await panel.locator("#action-email .btn.primary").click();
      await panel.locator("#action-email .receipt").waitFor();
      await top(panel, "#action-email");
    },
  },
];

// One hero screenshot per other language: headline, body, fact labels, demo label.
const LOCAL = {
  fr: ["À qui appartient ce site ?", "Ouvrez le panneau sur n'importe quel site. Un clic montre l'entreprise derrière : nom, secteur, taille, pays, LinkedIn.", "appel le moins cher", "pour un appel en échec", "Données de démo"],
  de: ["Wem gehört diese Website?", "Öffnen Sie das Panel auf einer Website. Ein Klick zeigt die Firma dahinter: Name, Branche, Größe, Land, LinkedIn.", "günstigster Abruf", "für einen Fehlschlag", "Demodaten"],
  es: ["¿De quién es esta web?", "Abre el panel en cualquier sitio. Un clic muestra la empresa detrás: nombre, sector, tamaño, país, LinkedIn.", "consulta más barata", "por una consulta fallida", "Datos de demo"],
  it: ["Di chi è questo sito?", "Apri il pannello su qualsiasi sito. Un clic mostra l'azienda dietro: nome, settore, dimensione, paese, LinkedIn.", "chiamata più economica", "per una chiamata fallita", "Dati demo"],
  nl: ["Van wie is deze website?", "Open het paneel op elke website. Eén klik toont het bedrijf erachter: naam, sector, omvang, land, LinkedIn.", "goedkoopste oproep", "voor een mislukte oproep", "Demogegevens"],
  pt: ["De quem é este site?", "Abra o painel em qualquer site. Um clique mostra a empresa por trás: nome, setor, porte, país, LinkedIn.", "consulta mais barata", "por consulta com falha", "Dados de demonstração"],
};

for (const shot of SHOTS) {
  const { context, page, panel } = await open({ kind: "shot", ...shot.params }, { width: 1280, height: 800 });
  await shot.drive(panel);
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve("store/screenshots", shot.file) });
  await context.close();
  console.log(`store/screenshots/${shot.file}`);
}

for (const [lang, [h, p, l1, l2, demo]] of Object.entries(LOCAL)) {
  mkdirSync(`store/screenshots/${lang}`, { recursive: true });
  const { context, page, panel } = await open({ kind: "shot", scene: "company", url, h, p, f1: money(PRICE["company.enrich"]), l1, f2: "$0", l2, demo }, { width: 1280, height: 800 }, { lang });
  await run(panel, "company");
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(`store/screenshots/${lang}/1-company-lookup-${lang}.png`) });
  await context.close();
  console.log(`store/screenshots/${lang}/1-company-lookup-${lang}.png`);
}

for (const [kind, viewport, file] of [["small", { width: 440, height: 280 }, "promo-small-440x280.png"], ["marquee", { width: 1400, height: 560 }, "promo-marquee-1400x560.png"]]) {
  const { context, page, panel } = await open({ kind, scene: "company" }, viewport);
  if (kind === "marquee") await run(panel, "company");
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve("store", file) });
  await context.close();
  console.log(`store/${file}`);
}

if (!process.argv.includes("--no-video")) {
  const dir = join(root, "video");
  const { context, page, panel } = await open({ kind: "shot", scene: "video", url, h: "Company lookup for the site you are on", p: "Who owns it, traffic and tech stack. The price shows before each call.", f1: money(PRICE["company.enrich"]), l1: "cheapest listed call", f2: "$0", l2: "for a failed call" }, { width: 1280, height: 800 }, { video: dir });
  await page.waitForTimeout(1500);
  for (const id of ["company", "traffic", "tech"]) {
    await run(panel, id, 1200);
    await page.waitForTimeout(2500);
  }
  const webm = await page.video().path();
  await context.close();
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "23", resolve("store/demo-video.mp4")]);
    console.log("store/demo-video.mp4");
  } catch {
    cpSync(webm, resolve("store/demo-video.webm"));
    console.log("store/demo-video.webm (ffmpeg not found, kept WebM)");
  }
}

await browser.close();
server.close();
rmSync(root, { recursive: true, force: true });
