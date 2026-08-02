/*
 * Normalize the question bank:
 *  - Add origin="textbook" to all textbook-generated sources
 *  - Add origin="past-paper" to all real past paper sources
 *  - Replace raw filename sources with friendly labels
 *  - Does NOT change IDs or remove questions (preserves saved-test history)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src", "data", "questions.json");

// Friendly label mapping for textbook-generated sources
const TEXTBOOK_SOURCE_LABEL = "Textbook Bank";
const textbookSources = new Set([
  "combined_mcqs.json",
  "Generated textbook MCQs",
  "Biology_11th_Class_Book_By_Muhammad_Ali_mcqs.json",
  "kpk_11_bio_50_mcqs.json",
]);

// Past paper sources (real exams) - keep their label, add origin
const pastPaperSources = new Set([
  "KMU 2022",
  "KMU 2024",
  "KMU 2025",
  "DUHS 2024",
  "NUMS 2012",
  "SIBA 2025",
  "MDCAT_MCQs_KMU_2024_2026-07-27.json",
  "2765-KMU_MDCAT_2025_Paper_PDF_with_Answer_Key-_taleem360_com__2026-07-27.json",
  "Unknown 0",
]);

// Rename raw filenames to friendly past-paper labels
const sourceRename = {
  "MDCAT_MCQs_KMU_2024_2026-07-27.json": "KMU 2024",
  "2765-KMU_MDCAT_2025_Paper_PDF_with_Answer_Key-_taleem360_com__2026-07-27.json": "KMU 2025",
  "Unknown 0": "KMU 2024",
};

// Backup
const backup = `${file}.bak-${Date.now()}`;
fs.copyFileSync(file, backup);

const data = JSON.parse(fs.readFileSync(file, "utf8"));
let textbookTagged = 0;
let pastPaperTagged = 0;

for (const q of data) {
  const src = q.source || "";
  if (textbookSources.has(src)) {
    q.origin = "textbook";
    q.source = TEXTBOOK_SOURCE_LABEL;
    textbookTagged++;
  } else if (pastPaperSources.has(src)) {
    q.origin = "past-paper";
    if (sourceRename[src]) {
      q.source = sourceRename[src];
    }
    pastPaperTagged++;
  }
  // Unknown/other sources: leave origin undefined (still usable in all tests)
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Total questions: ${data.length}`);
console.log(`Tagged as textbook: ${textbookTagged} (relabeled to "${TEXTBOOK_SOURCE_LABEL}")`);
console.log(`Tagged as past-paper: ${pastPaperTagged}`);
console.log(`Backup saved: ${backup}`);
