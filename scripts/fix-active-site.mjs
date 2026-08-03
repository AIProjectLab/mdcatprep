import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

// Active site binds substrate = A. KMU 2025 stored B (wrong).
// Verified against BUMHS 2025 solved key (answer A for the same question).
for (const id of [708, 1296]) {
  const q = d.find((x) => x.id === id);
  if (q && q.answer === "B") {
    q.answer = "A";
    console.log("id", id, "answer B -> A (active site binds substrate)");
    rq.push({
      id,
      reason: "answer-corrected-via-key",
      subject: q.subject,
      source: q.source,
      text: q.text,
      note: "KMU 2025 key wrong; corrected to A per BUMHS 2025 solved key (active site binds substrate)",
    });
  }
}

fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
