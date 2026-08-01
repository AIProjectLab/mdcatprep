import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = path.join(root, "src", "data", "questions.json");
const [, , inputArg, ...args] = process.argv;

const option = (name, fallback = "") => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1] || fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

if (!inputArg) {
  console.error("Usage: npm run sync:questions -- <file.json> --source \"KPK Biology 11th\" --year 2026 [--dry-run]");
  process.exit(1);
}

const sourceDefault = option("source");
const yearValue = option("year");
const yearDefault = yearValue ? Number(yearValue) : 0;
const dryRun = hasFlag("dry-run");

if (!sourceDefault || !Number.isInteger(yearDefault) || yearDefault < 0) {
  throw new Error("Both --source and a non-negative integer --year are required.");
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const existing = readJson(outputFile);
const incoming = readJson(path.resolve(process.cwd(), inputArg));
const items = Array.isArray(incoming) ? incoming : incoming.mcqs ?? incoming.questions ?? incoming.data;
if (!Array.isArray(items) || !items.length) throw new Error("Input must be a non-empty JSON array.");

const subjects = new Set(["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"]);
const normalize = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const keyFor = (q) => `${normalize(q.subject)}|${normalize(q.text)}`;

const keys = new Set(existing.map(keyFor));
let nextId = Math.max(0, ...existing.map((q) => Number(q.id) || 0)) + 1;
const imported = [];
const duplicates = [];

for (const [index, q] of items.entries()) {
  const answer = String(q.answer ?? q.correct ?? "").trim().toUpperCase();
  const subject = String(q.subject ?? "").trim();
  const source = String(q.source ?? sourceDefault).trim();
  const year = Number.isInteger(q.year) ? q.year : yearDefault;
  const text = String(q.text ?? "").trim();
  const options = q.options ?? {};

  if (!text || !subjects.has(subject) || !source || !Number.isInteger(year) || year < 0) {
    throw new Error(`Item ${index + 1} is missing valid text, subject, source, or year.`);
  }
  if (!["A", "B", "C", "D"].every((key) => typeof options[key] === "string" && options[key].trim())) {
    throw new Error(`Item ${index + 1} must contain non-empty A, B, C, and D options.`);
  }
  if (!["A", "B", "C", "D"].includes(answer)) throw new Error(`Item ${index + 1} has invalid answer: ${answer}`);

  const clean = {
    id: nextId++, subject, year, source, text,
    options: Object.fromEntries(["A", "B", "C", "D"].map((key) => [key, options[key].trim()])),
    answer,
    ...(q.explanation ? { explanation: String(q.explanation).trim() } : {}),
  };
  const key = keyFor(clean);
  if (keys.has(key)) {
    duplicates.push({ index: index + 1, text });
    continue;
  }
  keys.add(key);
  imported.push(clean);
}

const merged = [...existing, ...imported];
console.log(`Existing: ${existing.length}`);
console.log(`Incoming: ${items.length}`);
console.log(`New: ${imported.length}`);
console.log(`Duplicates skipped: ${duplicates.length}`);

if (!dryRun && imported.length) {
  const tempFile = `${outputFile}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(merged, null, 2)}\n`);
  fs.renameSync(tempFile, outputFile);
  console.log(`Updated ${path.relative(root, outputFile)}`);
} else if (dryRun) {
  console.log("Dry run: no files changed.");
} else {
  console.log("No changes needed.");
}

