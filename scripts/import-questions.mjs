import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = path.join(root, "src", "data", "questions.json");
const [, , inputArg, ...args] = process.argv;
const option = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? "" : args[i + 1] || ""; };

if (!inputArg) {
  console.error("Usage: npm run import:questions -- <file.json> --source \"KMU 2025\" --year 2025");
  process.exit(1);
}

const sourceDefault = option("source");
const yearDefault = Number(option("year"));
const existing = JSON.parse(fs.readFileSync(outputFile, "utf8"));
const incoming = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), inputArg), "utf8"));
const items = Array.isArray(incoming) ? incoming : incoming.mcqs;
if (!Array.isArray(items) || !items.length) throw new Error("Input must be a JSON array or an object containing an mcqs array.");

const subjects = new Set(["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"]);
let nextId = Math.max(0, ...existing.map((q) => Number(q.id) || 0)) + 1;
const imported = items.map((q, index) => {
  const answer = String(q.answer ?? q.correct ?? "").toUpperCase();
  const subject = String(q.subject ?? "").trim();
  const year = Number.isInteger(q.year) ? q.year : yearDefault;
  const source = String(q.source ?? sourceDefault).trim();
  const options = q.options ?? {};
  if (!q.text?.trim() || !subjects.has(subject) || !source || !Number.isInteger(year)) throw new Error(`Item ${index + 1} is missing text, valid subject, source, or year.`);
  if (!["A", "B", "C", "D"].every((key) => typeof options[key] === "string" && options[key].trim())) throw new Error(`Item ${index + 1} must contain non-empty A, B, C, and D options.`);
  if (!answer || typeof options[answer] !== "string" || !options[answer].trim()) throw new Error(`Item ${index + 1} has an invalid answer: ${answer}`);
  const cleanOptions = Object.fromEntries(Object.entries(options).filter(([key, value]) => /^[A-Z]$/.test(key) && typeof value === "string" && value.trim()).map(([key, value]) => [key, value.trim()]));
  return {
    id: Number.isInteger(q.id) ? q.id : nextId++, subject, year, source,
    text: String(q.text).trim(),
    options: cleanOptions,
    answer, ...(q.explanation ? { explanation: String(q.explanation).trim() } : {}),
  };
});

const ids = new Set(existing.map((q) => q.id));
for (const q of imported) if (ids.has(q.id)) throw new Error(`Duplicate question id detected: ${q.id}`); else ids.add(q.id);
fs.writeFileSync(outputFile, `${JSON.stringify([...existing, ...imported], null, 2)}\n`);
console.log(`Imported ${imported.length} questions. Total question bank: ${existing.length + imported.length}.`);
