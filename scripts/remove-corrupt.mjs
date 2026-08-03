import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const corruptIds = [5138, 5398, 11485, 12424, 34423, 34760, 58625, 59003, 59382, 59521, 59523, 59702, 60075];

const removed = [];
const kept = [];
for (const q of d) {
  if (corruptIds.includes(q.id)) {
    removed.push(q);
    rq.push({
      id: q.id,
      reason: "corrupt-options",
      subject: q.subject,
      source: q.source,
      text: q.text,
      options: q.options,
      answer: q.answer,
      note: "All four options identical/placeholder - removed from bank, unrecoverable from source",
    });
  } else {
    kept.push(q);
  }
}

console.log("Removed:", removed.length, "| Kept:", kept.length);
removed.forEach((q) => console.log("  removed id", q.id, q.subject, "|", q.text.slice(0, 60)));

fs.writeFileSync(bankFile, JSON.stringify(kept, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
