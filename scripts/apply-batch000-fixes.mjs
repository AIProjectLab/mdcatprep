import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const byId = new Map(d.map((q) => [q.id, q]));

// Confirmed wrong-answer fixes (13) — verified by domain knowledge + ChatGPT second opinion
const answerFixes = {
  10023: "C", // Kc = [NO]^2/[N2][O2]
  10033: "C", // add more SO2 increases yield (catalyst affects rate only)
  10034: "D", // Le Chatelier applies to physical + chemical
  10052: "C", // HF weakest (Ka 6.8e-4 < H2SO3 Ka 1.7e-2)
  10066: "A", // vinegar pH ~2.3
  10089: "A", // base accepts proton -> conjugate acid
  10093: "D", // conjugate base = remove proton from acid
  10097: "B", // Ca(OH)2 2M OH- vs 1M H+ -> basic
  10099: "D", // pOH = 14 - 9 = 5
  10100: "B", // weak base + strong acid salt -> acidic ~6
  10102: "B", // pH = -log(1.35e-5) = 4.87
  10136: "A", // order w.r.t [B] = exponent 1
  1246: "C", // centrifugation isolates cell components
};

// #4 (10043): keep D as answer — D is the unambiguously false statement.
// ChatGPT noted A is loose but D is the clearly-incorrect one the exam intends.
// Also log it with a note for transparency.
answerFixes[10043] = "D";

let fixed = 0;
for (const [id, correct] of Object.entries(answerFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing " + id);
  if (q.answer === correct) {
    console.log(`id ${id}: already ${correct}, no change`);
    continue;
  }
  console.log(`id ${id}: ${q.answer} -> ${correct}`);
  q.answer = correct;
  fixed++;
}

// #9 (10097): make question unambiguous by stating equal volumes
const q10097 = byId.get(10097);
q10097.text = "Equal volumes of 1 M solution of Ca(OH)2 and 1 M solution of HCl are mixed. The product solution is";
console.log("id 10097 text updated to specify equal volumes");

// Remove flawed question 9972 (all four statements true, no incorrect option)
const kept = [];
let removed = 0;
for (const q of d) {
  if (q.id === 9972) {
    rq.push({
      id: q.id,
      reason: "flawed-question",
      subject: q.subject,
      source: q.source,
      text: q.text,
      options: q.options,
      answer: q.answer,
      note: "All four options are true statements; no incorrect option exists. Removed.",
    });
    removed++;
    continue;
  }
  kept.push(q);
}

// Add notes for the fixed answers
for (const [id, correct] of Object.entries(answerFixes)) {
  rq.push({
    id: Number(id),
    reason: "answer-corrected-review",
    note: `Corrected ${byId.get(Number(id)).answer}-> was stored; verified by domain knowledge + second opinion. Now: ${correct}`,
  });
}

console.log(`\nFixed answers: ${fixed} | Removed flawed: ${removed} | Bank: ${kept.length}`);

fs.writeFileSync(bankFile, JSON.stringify(kept, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
