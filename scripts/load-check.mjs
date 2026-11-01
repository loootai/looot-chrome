// Loads dist/ as an unpacked extension in headless Chromium and checks that the manifest is
// accepted, the service worker starts, and the side panel page runs with no errors and can
// reach the free catalog. Usage: PW_CORE=... PW_CHROMIUM=... node scripts/load-check.mjs [shot.png]
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "./pw.mjs";

const dist = resolve("dist");
const profile = mkdtempSync(join(tmpdir(), "looot-chrome-"));
const pw = await chromium();
const context = await pw.chromium.launchPersistentContext(profile, {
  executablePath: pw.executablePath,
  headless: false,
  args: ["--headless=new", `--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
  viewport: { width: 400, height: 760 },
});
let failed = false;
try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker", { timeout: 15_000 }));
  const id = new URL(worker.url()).host;
  console.log(`service worker: ${worker.url()}`);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  await page.goto(`chrome-extension://${id}/sidepanel.html`);
  const manifest = await page.evaluate(() => chrome.runtime.getManifest());
  console.log(`manifest: v${manifest.manifest_version} "${manifest.name}" ${manifest.version}`);
  console.log(`permissions: ${manifest.permissions.join(", ")} | hosts: ${manifest.host_permissions.join(", ")}`);
  await page.waitForSelector("#action-verify .price:not(.skeleton)", { timeout: 20_000 });
  console.log(`live price line: ${await page.textContent("#action-verify .price")}`);
  await page.click("#tab-catalog");
  await page.fill("#catalog-q", "verify email");
  await page.waitForSelector(".results .result-row:not(.skeleton-row)", { timeout: 20_000 });
  console.log(`live catalog rows: ${await page.locator(".results .result-row").count()}`);
  if (process.argv[2]) await page.screenshot({ path: process.argv[2] });
  if (errors.length > 0) {
    failed = true;
    console.log(errors.join("\n"));
  } else {
    console.log("errors: none");
  }
} catch (err) {
  failed = true;
  console.log(`FAILED: ${err.message}`);
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
