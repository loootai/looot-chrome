// Zips dist/ into store/whozit-<version>.zip, the file the Chrome Web Store takes.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

if (!existsSync("dist/manifest.json")) throw new Error("Run npm run build first.");
const { version } = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const out = resolve("store", `whozit-${version}.zip`);
rmSync(out, { force: true });
execFileSync("zip", ["-r", "-X", "-q", out, ".", "-x", "*.DS_Store"], { cwd: "dist" });
console.log(out);
