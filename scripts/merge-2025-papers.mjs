/*
 * Merge the separate past-papers file's 2025 MCQs into the main app bank.
 * Only adds entries missing from the main bank (dedup by normalized text).
 * Keeps origin="past-paper" and the existing schema.
 * Does NOT modify or remove anything already in the main bank.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appFile = path.join(root, "src", "data", "questions.json");
const ppFile = path.join(root, "src", "data", "past-papers", "past-papers.json");

const norm = (t) => String(t ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const app = JSON.parse(fs.readFileSync(appFile, "utf8"));
const pp = JSON.parse(fs.readFileSync(ppFile, "utf8"));

// What's already in the main bank (by subject|text)
const existingKeys = new Set(app.map((q) => `${norm(q.subject)}|${norm(q.text)}`));
let nextId = Math.max(0, ...app.map((q) => Number(q.id) || 0)) + 1;

let added = 0;
let skipped = 0;
const addedBySource = {};

for (const q of pp) {
  // Only sync 2025 papers (the goal: all 2025 boards in the main bank)
  if (Number(q.year) !== 2025) continue;

  const key = `${norm(q.subject)}|${norm(q.text)}`;
  if (existingKeys.has(key)) {
    skipped++;
    continue;
  }

  existingKeys.add(key);
  const clean = {
    id: nextId++,
    subject: q.subject,
    year: q.year,
    source: q.source,
    origin: "past-paper",
    text: q.text,
    options: q.options,
    answer: q.answer,
  };
  app.push(clean);
  added++;
  addedBySource[q.source] = (addedBySource[q.source] || 0) + 1;
}

fs.writeFileSync(appFile, `${JSON.stringify(app, null, 2)}\n`);

console.log(`Main bank: ${app.length} total`);
console.log(`Added 2025 MCQs: ${added}`);
console.log(`Skipped (already present): ${skipped}`);
console.log("Added by source:", addedBySource);
