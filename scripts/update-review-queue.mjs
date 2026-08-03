import fs from "node:fs";

const reviewFile = "src/data/review-queue.json";
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

// Add notes for questions that had answer ambiguity (fixed options but answer uncertain)
const flagNotes = [
  { id: 1160, note: "SHE+Cu electrochemistry: options made distinct; stored answer B (H+ reduces) needs official SIBA key verification - chemically Cu2+ is reduced" },
  { id: 5115, note: "n=4 subshells: options deduped; stored answer C content questionable (should be 4s,4p,4d,4f)" },
  { id: 37620, note: "hysteresis loop: options made distinct; question text truncated, answer A kept" },
];

for (const f of flagNotes) {
  rq.push({ id: f.id, reason: "answer-uncertain", note: f.note });
}

fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Review queue updated:", rq.length, "items");
console.log("by reason:", JSON.stringify(rq.reduce((a, r) => { a[r.reason] = (a[r.reason] || 0) + 1; return a; }, {})));
