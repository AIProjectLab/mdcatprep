import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const byId = new Map(d.map((q) => [q.id, q]));

// Confirmed wrong answers (verified by calculation/domain knowledge)
const answerFixes = {
  10172: "D", // mole fraction methanol = 0.400 -> D(0.42)
  10210: "D", // molarity pure water = 55.6M
  10270: "A", // S in H2SO4 = +6
  10286: "A", // Zn potential = -0.76V
  10326: "A", // Zn > Al
  10324: "A", // reduction = Br2 -> 2Br-
  10327: "D", // ions discharged
  10257: "A", // DH = DE for solids/liquids
  10312: "C", // rust Fe2+ + O2
  10223: "B", // exothermic = CH4 combustion (H2+I2 endothermic)
};

let fixed = 0;
for (const [id, correct] of Object.entries(answerFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing " + id);
  if (q.answer === correct) { console.log(`id ${id}: already ${correct}`); continue; }
  console.log(`id ${id}: ${q.answer} -> ${correct}`);
  q.answer = correct;
  rq.push({
    id: Number(id),
    reason: "answer-corrected-review",
    note: `Corrected from ${q.answer} (was stored) to ${correct} - batch-001 review`,
  });
  fixed++;
}

// Flawed question 10171: no correct option. Remove it.
const kept = [];
let removed = 0;
for (const q of d) {
  if (q.id === 10171) {
    rq.push({
      id: q.id,
      reason: "flawed-question",
      note: "Molality = 1.99m, no matching option (0.34,0.67,0.90,1.20). Removed.",
    });
    removed++;
    continue;
  }
  kept.push(q);
}

// 10143 questionable - log for ChatGPT verification but do NOT change yet
rq.push({
  id: 10143,
  reason: "answer-uncertain",
  note: "Temp effect: C(increase KE) vs D(more molecules attain Ea). Both true; D is classic MDCAT answer. Needs confirmation.",
});

console.log(`\nFixed: ${fixed} | Removed flawed: ${removed} | Bank: ${kept.length}`);
fs.writeFileSync(bankFile, JSON.stringify(kept, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
