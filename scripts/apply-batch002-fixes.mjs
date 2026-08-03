import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const byId = new Map(d.map((q) => [q.id, q]));

// Confirmed wrong answers (domain-verified)
const answerFixes = {
  10349: "B", // lattice energy is negative
  10430: "D", // strongest reducing agent = I2 (F2 is oxidizer)
  10432: "C", // highest melting halide = NaF
  10441: "A", // inert pair effect dominates in Pb
  10443: "D", // Group II have small radii, not large
  10453: "A", // colored compounds from unpaired d electrons
  10455: "D", // smallest radius = Cr
  10457: "D", // highest electronegativity = Cr
  10458: "D", // highest density = Cr
  10484: "A", // alkaline permanganate -> manganate (green)
  10505: "A", // [CuCl4]2- is tetrahedral
  10506: "D", // Cr in CrO2Cl2 = +6
  10523: "A", // wood->coal = decomposition
};

let fixed = 0;
for (const [id, correct] of Object.entries(answerFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing " + id);
  if (q.answer === correct) { console.log(`id ${id}: already ${correct}`); continue; }
  console.log(`id ${id}: ${q.answer} -> ${correct}`);
  q.answer = correct;
  rq.push({ id: Number(id), reason: "answer-corrected-review", note: `Corrected to ${correct} - batch-002 review` });
  fixed++;
}

// Flag uncertain ones for ChatGPT confirmation (do not change)
const flags = [
  { id: 10415, note: "Cl electron affinity -3.7 vs -4.0 eV, source-dependent" },
  { id: 10462, note: "Sc and V both show +3; ambiguous which is intended" },
  { id: 10477, note: "1 mol Fe2+ -> 1/3 mol Cr3+ (6Fe2+ -> 2Cr3+); no matching option (1,2,3,6)" },
  { id: 10489, note: "Fe3+ hydrolysis pH effect with OH- - ambiguous" },
  { id: 10530, note: "Both Taxol and Artemisinin are natural products - two valid answers" },
];
for (const f of flags) {
  rq.push({ id: f.id, reason: "answer-uncertain", note: f.note });
}

console.log(`\nFixed: ${fixed} | Flagged: ${flags.length}`);
fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
