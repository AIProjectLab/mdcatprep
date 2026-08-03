import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");
const reviewFile = path.join(root, "src", "data", "review-queue.json");
const dryRun = process.argv.includes("--dry-run");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, data) => {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(temp, file);
};

const bank = readJson(bankFile);
const review = [];
const originalCount = bank.length;

// ---- 1. Strip extraction junk ----
const MEDIX_TEXT = /\s*\(bumhs-2025[\s\S]*$/gi;
const MEDIX_OPT = /[\s]*(?:---\s*[✶★♥]|===+\s*PAGE)[\s\S]*$/gi;
const PAGE_MARK = /\s*===+\s*PAGE\s+\d+\s*\(len=\d+\)\s*===+[\s\S]*?---\s*[✶★♥]+\s*---\s*MEDIX\s*♥MDCAT\s*---\s*[✶★♥]+\s*/gi;
const PAGE_MARK2 = /\s*===+\s*PAGE\s+\d+\s*\(len=\d+\)\s*===+\s*$/g;

let textFixed = 0;
let optFixed = 0;

const cleaned = bank.map((q) => {
  let text = q.text;
  const newText = text.replace(MEDIX_TEXT, " ").replace(/\s+/g, " ").trim();
  if (newText !== text) textFixed++;
  text = newText;

  const options = { ...q.options };
  for (const key of Object.keys(options)) {
    let val = options[key];
    const next = val
      .replace(PAGE_MARK, " ")
      .replace(PAGE_MARK2, " ")
      .replace(MEDIX_OPT, " ")
      .replace(/\s+---+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (next !== val) optFixed++;
    options[key] = next;
  }

  return { ...q, text, options };
});

// ---- 2. Deduplicate ----
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const optKey = (q) => JSON.stringify(Object.keys(q.options).sort().map((k) => norm(q.options[k])));
const keep = [];
const seen = new Map();
let removedDup = 0;

for (const q of cleaned) {
  // Duplicates are only true duplicates when text AND all option values match
  const key = `${norm(q.origin)}|${q.year}|${norm(q.text)}|${optKey(q)}`;
  const prev = seen.get(key);

  // Same question (text + options) but different answer => conflict, flag for review
  if (prev && prev.answer !== q.answer) {
    review.push({
      id: q.id,
      reason: "duplicate-conflict",
      subject: q.subject,
      source: q.source,
      year: q.year,
      text: q.text,
      answers: [prev.answer, q.answer],
    });
    keep.push(q);
    continue;
  }

  // Exact true duplicate (same origin + year + text + options + answer) => drop the later copy
  if (prev) {
    removedDup++;
    continue;
  }

  seen.set(key, q);
  keep.push(q);
}

// ---- 3. Flag broken / degenerate questions ----
let broken = 0;
const active = [];
for (const q of keep) {
  const textLen = (q.text || "").trim().length;
  const optValues = Object.values(q.options || {});
  const blankOpts = optValues.filter((v) => !v || !String(v).trim());
  if (textLen < 10 || blankOpts.length > 0) {
    review.push({
      id: q.id,
      reason: textLen < 10 ? "text-too-short" : "blank-option",
      subject: q.subject,
      source: q.source,
      year: q.year,
      text: q.text,
      options: q.options,
      answer: q.answer,
    });
    broken++;
  } else {
    active.push(q);
  }
}

// ---- Report ----
console.log(`Original questions: ${originalCount}`);
console.log(`Text junk fixed: ${textFixed}`);
console.log(`Option junk fixed: ${optFixed}`);
console.log(`True duplicates removed: ${removedDup}`);
console.log(`Flagged for review: ${review.length}`);

if (dryRun) {
  console.log("Dry run: no files changed.");
} else {
  writeJson(bankFile, active);
  if (review.length) writeJson(reviewFile, review);
  console.log(`Bank now: ${active.length} (${broken} broken removed)`);
  console.log(`Review queue written: ${path.relative(root, reviewFile)}`);
}
