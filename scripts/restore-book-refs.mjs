/*
 * Restore book references into the app question bank.
 *  - Reads raw generated_mcqs/combined_mcqs.json (which has per-question source labels)
 *  - Matches app textbook questions to the raw source by normalized text
 *  - Adds a clean human-friendly `book` field
 *  - Past-paper questions already have clean source labels (DUHS 2024 etc.) - untouched
 *  - Dry-run by default; pass --apply to write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appFile = path.join(root, "src", "data", "questions.json");
const rawFile = path.join(root, "questionbank-generator", "generated_mcqs", "combined_mcqs.json");

const apply = process.argv.includes("--apply");

// Map raw generator source labels -> clean friendly book names
const SOURCE_TO_BOOK = {
  // KPK (Muhammad Ali)
  "Biology 11th Class Book By Muhammad Ali": "KPK Biology 11th (Muhammad Ali)",
  "Biology 12th Class Book By Muhammad Ali": "KPK Biology 12th (Muhammad Ali)",
  "Chemistry 11th Class Book By Muhammad Ali": "KPK Chemistry 11th (Muhammad Ali)",
  "Chemistry 12th Class Book By Muhammad Ali": "KPK Chemistry 12th (Muhammad Ali)",
  "Physics 11th Class Book By Muhammad Ali": "KPK Physics 11th (Muhammad Ali)",
  "Physics 12th Class Book By Muhammad Ali": "KPK Physics 12th (Muhammad Ali)",
  // Punjab
  "10. 2018-G11-Biology-E": "Punjab Biology 11th (2018)",
  "2524-1st Year Physics New SNC Textbook 2025 PDF (PECTAA)-": "Punjab Physics 11th (2025)",
  "2525-11th Class Biology New Punjab Textbook 2025 PECTAA-": "Punjab Biology 11th (2025)",
  "2529-11th Class Chemistry PECTAA SNC Punjab Text Book PDF-": "Punjab Chemistry 11th (SNC)",
  "2869-12th Class Physics PECTAA New Text Book 2026 PDF-": "Punjab Physics 12th (2026)",
  "2870-2nd Year Chemistry PECTAA Text Book 2026 PDF-": "Punjab Chemistry 12th (2026)",
  "2871-2nd Year Biology PECTAA Text Book 2026-27 PDF-": "Punjab Biology 12th (2026)",
  // Sindh
  "3019-12th-class-biology-sindh-text-book-pdf-by-stbb--3HbPc": "Sindh Biology 12th (STBB)",
  "3022-12th-class-physics-sindh-text-book-pdf-by-stbb--0HSdG": "Sindh Physics 12th (STBB)",
  // Generic / unknown
  "Generated textbook MCQs": "Textbook Bank",
};

const norm = (t) => String(t ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const app = JSON.parse(fs.readFileSync(appFile, "utf8"));
const raw = JSON.parse(fs.readFileSync(rawFile, "utf8"));

// Build text -> book lookup from raw data (prefer textbook book labels over generic)
const bookByText = new Map();
for (const q of raw) {
  const t = norm(q.text);
  if (!t) continue;
  const rawSrc = q.source;
  const book = SOURCE_TO_BOOK[rawSrc];
  if (!book) continue;
  // Prefer a specific book over "Textbook Bank" generic label
  const existing = bookByText.get(t);
  if (!existing || (existing === "Textbook Bank" && book !== "Textbook Bank")) {
    bookByText.set(t, book);
  }
}

let tagged = 0;
let untagged = 0;
let matchedToBook = 0;
const missing = [];

for (const q of app) {
  // Only tag textbook-origin questions with a book. Past papers keep their source label.
  if (q.origin !== "textbook") continue;
  const t = norm(q.text);
  const book = bookByText.get(t);
  if (book) {
    q.book = book;
    matchedToBook++;
  } else {
    untagged++;
    if (missing.length < 10) missing.push(q.text?.slice(0, 60));
  }
  tagged++;
}

console.log(`App total: ${app.length}`);
console.log(`Textbook-origin questions processed: ${tagged}`);
console.log(`Matched to a specific book: ${matchedToBook}`);
console.log(`No book found (will show nothing / generic): ${untagged}`);
if (missing.length) {
  console.log("\nSample unmatched texts:");
  for (const m of missing) console.log(`  - ${m}`);
}

// Book distribution
const dist = {};
for (const q of app) {
  if (q.book) dist[q.book] = (dist[q.book] || 0) + 1;
}
console.log("\n=== BOOK DISTRIBUTION ===");
for (const [b, c] of Object.entries(dist).sort((a, b2) => b2[1] - a[1])) {
  console.log(`  ${b}: ${c}`);
}

if (apply) {
  fs.writeFileSync(appFile, `${JSON.stringify(app, null, 2)}\n`);
  console.log("\nSaved questions.json");
} else {
  console.log("\nDRY RUN - no file written. Re-run with --apply to save.");
}
