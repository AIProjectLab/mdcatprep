import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const byId = new Map(d.map((q) => [q.id, q]));

// Mislabeled Chemistry questions currently tagged as Biology with Biology units.
// Re-subject to Chemistry with the correct Chemistry unit label.
const LIQUIDS = "Liquids and Hydrogen Bonding";
const SOLIDS = "Solids and Crystal Lattice";
const EQUILIBRIUM = "Chemical Equilibrium";
const GASES = "Gases";

const fixes = {
  // Liquids & viscosity / ice density
  9860: LIQUIDS, 9861: LIQUIDS, 9862: LIQUIDS, 9863: LIQUIDS,
  9927: LIQUIDS, 9928: LIQUIDS, 9929: LIQUIDS, 9930: LIQUIDS,
  9968: LIQUIDS, // low density & heat of fusion of ice
  // Crystal lattice & solids
  9885: SOLIDS, 9886: SOLIDS, 9887: SOLIDS, 9888: SOLIDS,
  9889: SOLIDS, 9890: SOLIDS, 9946: SOLIDS, 9947: SOLIDS,
  9948: SOLIDS, 9949: SOLIDS, 9953: SOLIDS, 9954: SOLIDS,
  9955: SOLIDS, 9956: SOLIDS, 9957: SOLIDS, 9958: SOLIDS,
  9959: SOLIDS, 9960: SOLIDS, 9961: SOLIDS, 9962: SOLIDS,
  9963: SOLIDS, 9964: SOLIDS, 9965: SOLIDS, 9966: SOLIDS,
  9967: SOLIDS, // allotropy
  9969: SOLIDS, 9970: SOLIDS,
  // Chemical equilibrium
  9971: EQUILIBRIUM, 9973: EQUILIBRIUM, 9974: EQUILIBRIUM, 9983: EQUILIBRIUM,
  // Gases
  37343: GASES, // Boyle's law
};

let fixed = 0;
for (const [id, unit] of Object.entries(fixes)) {
  const q = byId.get(Number(id));
  if (!q) { console.log("MISSING", id); continue; }
  q.subject = "Chemistry";
  q.unitLabel = unit;
  rq.push({
    id: Number(id),
    reason: "subject-corrected",
    note: `Was tagged Biology/${q.unitLabel} but is Chemistry content (book: ${q.book}); re-subjected to Chemistry/${unit}`,
  });
  fixed++;
}

console.log(`Re-subjected ${fixed} questions to Chemistry with correct units.`);
fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank and review queue updated.");
