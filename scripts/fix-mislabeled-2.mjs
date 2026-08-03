import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

// Re-subject remaining chemistry-book questions currently tagged as Biology (no unit).
// They stay untagged (excluded from tests) but now have the correct subject.
let fixed = 0;
for (const q of d) {
  if (q.origin !== "textbook" || !q.book) continue;
  if (q.book.toLowerCase().includes("chemistry") && q.subject !== "Chemistry") {
    q.subject = "Chemistry";
    rq.push({
      id: q.id,
      reason: "subject-corrected",
      note: `Was tagged ${q.subject}; re-subjected to Chemistry (untagged, excluded from tests)`,
    });
    fixed++;
  }
}

console.log(`Re-subjected ${fixed} untagged chemistry-book questions to Chemistry.`);
fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
