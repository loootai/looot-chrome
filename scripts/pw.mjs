// Finds playwright-core and a Chromium build for the two browser scripts. Neither is a
// dependency of this repo: point PW_CORE at a playwright-core folder and PW_CHROMIUM at a
// Chromium or Chrome for Testing binary (branded Chrome no longer accepts --load-extension).
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

export async function chromium() {
  if (!process.env.PW_CORE || !process.env.PW_CHROMIUM) {
    throw new Error("Set PW_CORE (path to node_modules/playwright-core) and PW_CHROMIUM (path to a Chromium binary).");
  }
  const mod = await import(pathToFileURL(join(process.env.PW_CORE, "index.mjs")).href);
  return { chromium: mod.chromium, executablePath: process.env.PW_CHROMIUM };
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };

/** Serves a folder on a free localhost port. Returns { url, close }. */
export function serve(root) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
      try {
        const body = await readFile(join(root, path));
        res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream", "cache-control": "no-store" });
        res.end(body);
      } catch {
        res.writeHead(404).end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
  });
}
