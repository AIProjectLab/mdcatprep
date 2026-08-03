/*
 * Extract past-paper MCQs into a separate, self-contained file.
 *
 * SAFETY: This script only READS src/data/questions.json and WRITES a new
 * file in src/data/past-papers/. It NEVER modifies questions.json, so the
 * student app's current usage is completely unaffected.
 *
 * Run: node scripts/extract-past-papers.mjs
 *   (--dedupe to remove duplicate question texts; default keeps all)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appFile = path.join(root, "src", "data", "questions.json");
const outDir = path.join(root, "src", "data", "past-papers");
const outFile = path.join(outDir, "past-papers.json");

const dedupe = process.argv.includes("--dedupe");
const norm = (t) => String(t ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const data = JSON.parse(fs.readFileSync(appFile, "utf8"));
const pastPapers = data.filter((q) => q.origin === "past-paper");

let result = pastPapers;
let removed = 0;

if (dedupe) {
  const seen = new Set();
  const unique = [];
  for (const q of pastPapers) {
    const key = norm(q.text);
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    unique.push(q);
  }
  result = unique;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Past-paper MCQs in main bank: ${pastPapers.length}`);
console.log(`Dedupe: ${dedupe ? "ON" : "OFF"}`);
if (dedupe) console.log(`Removed duplicates: ${removed}`);
console.log(`Written: ${outFile} (${result.length} MCQs)`);
console.log(`Main bank untouched: ${appFile}`);
