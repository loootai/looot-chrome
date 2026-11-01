// Writes public/_locales/<lang>/messages.json from scripts/strings.mjs and checks the store
// limits: name 75 characters, description 132. `$1` becomes a Chrome placeholder; `$$` stays a
// literal dollar sign. Usage: node scripts/locales.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { LANGS, STRINGS } from "./strings.mjs";

const LIMITS = { extName: 75, extDescription: 132, extShortName: 12 };
const problems = [];

for (const [i, lang] of LANGS.entries()) {
  const out = {};
  for (const [key, values] of Object.entries(STRINGS)) {
    const text = values[i];
    if (typeof text !== "string" || !text) { problems.push(`${lang}.${key} missing`); continue; }
    if (LIMITS[key] && [...text].length > LIMITS[key]) problems.push(`${lang}.${key} is ${[...text].length} > ${LIMITS[key]}`);
    if (/—|–/.test(text)) problems.push(`${lang}.${key} has a dash`);
    const placeholders = {};
    const message = text.replace(/\$\$|\$(\d)/g, (all, n) => {
      if (!n) return all;
      placeholders[`p${n}`] = { content: `$${n}` };
      return `$p${n}$`;
    });
    out[key] = Object.keys(placeholders).length > 0 ? { message, placeholders } : { message };
  }
  mkdirSync(`public/_locales/${lang}`, { recursive: true });
  writeFileSync(`public/_locales/${lang}/messages.json`, JSON.stringify(out, null, 2) + "\n");
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`wrote ${LANGS.length} locales, ${Object.keys(STRINGS).length} messages each`);
