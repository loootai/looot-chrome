// Builds the unpacked extension into dist/. Everything the extension runs is in this bundle:
// no remote code, no CDN, no eval.
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });

await build({
  entryPoints: { sidepanel: "src/panel/main.ts", background: "src/background.ts" },
  outdir: "dist",
  bundle: true,
  format: "esm",
  target: "chrome116",
  minify: false,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
});
