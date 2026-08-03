import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");
const reviewFile = path.join(root, "src", "data", "review-queue.json");
const findingsFile = path.join(root, "scripts", "review-findings.json");

const bank = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
const findings = JSON.parse(fs.readFileSync(findingsFile, "utf8"));

// Findings format: { id, type, correct?, note?, remove? }
// type: WRONG-ANSWER (fix answer to `correct`), FLAWED (remove), SUBJECT (change subject/unit),
//       MOVE, UNCERTAIN (flag only, no change)

let fixed = 0, removed = 0, flagged = 0;
const kept = [];

for (const q of bank) {
  const f = findings.find((x) => x.id === q.id);
  if (!f) { kept.push(q); continue; }

  if (f.remove) {
    rq.push({
      id: q.id, reason: f.type === "FLAWED" ? "flawed-question" : "removed",
      subject: q.subject, source: q.source, text: q.text, options: q.options, answer: q.answer,
      note: f.note || "Removed during review",
    });
    removed++;
    continue;
  }

  if (f.correct && q.answer !== f.correct) {
    rq.push({
      id: q.id, reason: "answer-corrected-review",
      note: `Corrected from ${q.answer} to ${f.correct} - ${f.note || "review"}`,
    });
    q.answer = f.correct;
    fixed++;
  }

  if (f.subject) {
    q.subject = f.subject;
    if (f.unitLabel) q.unitLabel = f.unitLabel;
    rq.push({
      id: q.id, reason: "subject-corrected",
      note: `Re-subjected to ${f.subject}/${f.unitLabel || "no unit"} - ${f.note || "review"}`,
    });
    fixed++;
  }

  if (f.type === "UNCERTAIN") {
    rq.push({ id: q.id, reason: "answer-uncertain", note: f.note });
    flagged++;
  }

  kept.push(q);
}

console.log(`Applied: ${fixed} fixed | ${removed} removed | ${flagged} flagged`);
fs.writeFileSync(bankFile, JSON.stringify(kept, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log(`Bank: ${kept.length} | Review queue: ${rq.length}`);

// Clear applied findings so next batch starts fresh
fs.writeFileSync(findingsFile, "[]\n");
console.log("Findings file cleared.");
