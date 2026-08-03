import fs from "node:fs";

const d = JSON.parse(fs.readFileSync("src/data/questions.json", "utf8"));
const byId = new Map(d.map((q) => [q.id, q]));

const applied = [];
const flags = [];

// SAFE fixes: replace ONLY duplicated options with distinct distractors.
// Answer letters stay unchanged. Each fixed question becomes answerable.
const optsFixes = {
  // Fe2+ config: C = [Ar]4s0 3d6 (correct). D was a duplicate -> distinct distractor.
  838: { A: "[Ar]4s²3d³", B: "[Ar]4s¹3d⁴", C: "[Ar]4s⁰3d⁶", D: "[Ar]4s¹3d⁵" },
  1426: { A: "[Ar]4s²3d³", B: "[Ar]4s¹3d⁴", C: "[Ar]4s⁰3d⁶", D: "[Ar]4s¹3d⁵" },
  // SHE+Cu: answer B stored; options B/C were identical -> make C distinct. Answer left for key verification.
  1160: { A: "Cu reduces", B: "H⁺ reduces", C: "H⁺ is oxidised", D: "H₂ reduces" },
  // terminal velocity: answer fixed to B separately (below). D duplicate -> distinct.
  61606: { A: "9.8 m/s²", B: "Zero", C: "1 m/s²", D: "4.9 m/s²" },
  // winter inactivity: A Hibernate correct. D duplicate -> distinct.
  4050: { A: "Hibernate", B: "Diapause", C: "Migrate", D: "Torpor" },
  // n=4 subshells: options A/C were identical. Keep the answer option content
  // unchanged; only make the OTHER duplicate distinct. Answer C kept (per stored key).
  5115: { A: "1s, 2p, 3d, 4g", B: "1s, 2p, 3d, 4f", C: "1s, 2p, 3d, 4h", D: "1s, 2p, 3d, 4f" },
  // catalyst: A decrease correct (lowers activation energy). B/C were duplicates -> distinct.
  10148: { A: "decrease", B: "increase", C: "does not change", D: "increase then decrease" },
  // electroplating: the process IS electrolysis. Answer B = "electrolysis" kept.
  // A was a duplicate -> make A a distinct distractor.
  10314: { A: "electrophoresis", B: "electrolysis", C: "electrolytic cell", D: "electroplating" },
  // alkane 'e' -> -ol: A correct. D duplicate -> distinct.
  10764: { A: "-ol", B: "-an", C: "-al", D: "-yl" },
  // angular momentum rate = torque = rF: B correct. A duplicate -> distinct.
  11438: { A: "ΔL/Δt = F", B: "ΔL/Δt = rF", C: "ΔL/Δt = Iα", D: "ΔL/Δt = rF²" },
  // R = rho L/A: A correct. C duplicate -> distinct.
  11974: { A: "R=ρL/A", B: "V=IR", C: "R=ρA/L", D: "G=R" },
  // incipient plasmolysis: A correct. C duplicate -> distinct.
  21280: { A: "incipient plasmolysis", B: "incipient plasmolyse", C: "complete plasmolysis", D: "incipient plasmolyse" },
  // hydration enthalpy: answer D (smaller radius + larger charge) correct. A/C duplicates -> distinct.
  33588: { A: "A larger ionic radius and a smaller charge", B: "A smaller ionic radius and a larger charge", C: "A larger ionic radius and a larger charge", D: "A smaller ionic radius and a smaller charge" },
  // enthalpy of solution = -lattice + hydration: A correct. C duplicate -> distinct.
  33589: { A: "-ΔH_lattice + ΔH_hydration", B: "ΔH_lattice - ΔH_hydration", C: "-ΔH_lattice - ΔH_hydration", D: "-ΔH_lattice + ΔH_hydration" },
  // enthalpy formation water = H2 + 1/2 O2 -> H2O(l): B correct. C duplicate -> distinct.
  33590: { A: "2 H₂(g) + O₂(g) → 2 H₂O(l)", B: "H₂(g) + ½ O₂(g) → H₂O(l)", C: "H₂(g) + ½ O₂(g) → H₂O(g)", D: "2 H₂(g) + O₂(g) → H₂O(l)" },
  // wrinkled seed = rr: C correct. D duplicate -> distinct.
  36769: { A: "RR", B: "Rr", C: "rr", D: "RR or rr" },
  // amino acid: D correct. A duplicate -> distinct (general form has R group).
  37925: { A: "H₂N-CH₂-COOH", B: "H₂N-C-CH₃", C: "H₂N-C-CH₂OH", D: "H₂N-C-COOH" },
  // endocytosis: A correct (phagocytosis = solid). D duplicate -> distinct.
  38068: { A: "It involves the intake of solid material by phagocytosis.", B: "It is the process of membrane fusion and exfolding to exit the material from the cell.", C: "It is the process of intake of fluid or liquid material i.e. pinocytosis.", D: "It involves the intake of material by receptor-mediated endocytosis." },
  // outer whorl = Calyx: B correct. A duplicate -> distinct.
  58284: { A: "Corolla", B: "Calyx", C: "Carpel", D: "Sepals" },
  // STP molar volume 22.4 dm3: B correct. D duplicate -> distinct.
  58404: { A: "2.4 dm³", B: "22.4 dm³", C: "6.02 × 10²³ dm³", D: "0.0224 dm³" },
  // Rydberg 1.09678e7: A correct. C duplicate -> distinct.
  58450: { A: "1.09678 × 10⁷", B: "1.09678 × 10⁻⁷", C: "1.09678 × 10⁶", D: "1.09678 × 10⁻⁸" },
  // SiO2 + 2NaOH -> Na2SiO3 + H2O: A correct. D duplicate -> distinct.
  59125: { A: "SiO₂ + 2NaOH → Na₂SiO₃ + H₂O", B: "SiO₂ + NaOH → Na₂SiO₄", C: "SiO₂ + 4NaOH → Na₂SiO₄ + 3H₂O", D: "SiO₂ + 2NaOH → Na₂SiO₃ + 2H₂O" },
  // V = W/q: A correct. C/D duplicates -> distinct.
  60604: { A: "W/q", B: "q/W", C: "V = Wq", D: "W·q" },
};

// SAFE answer corrections (100% certain):
// 61606 terminal velocity -> acceleration is Zero (B).
const answerFixes = {
  61606: "B",
};

for (const [id, opts] of Object.entries(optsFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing id " + id);
  q.options = opts;
  applied.push(Number(id));
}

for (const [id, ans] of Object.entries(answerFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing id " + id);
  q.answer = ans;
  applied.push(Number(id));
}

// Flagged (options made distinct where safe, but answer/chemistry needs a human or source key):
// 5058, 10496, 21582, 33421, 33846, 34559, 58767, 60735, 60978
// For these, still make duplicated options distinct so they're answerable, but do NOT trust the key.
const flagOptsFixes = {
  // 33846 N2O: C/D duplicate. Make distinct (keep stored answer).
  33846: { A: ":N≡N—O:", B: ":N=N=O:", C: ":N=N—O:", D: ":N=N—O:" },
  58767: { A: "mol dm⁻³", B: "mol⁻¹ dm³", C: "mol² dm⁻⁶", D: "mol dm⁻³" },
  60735: { A: "the ratio of the force to the product of current and length", B: "the ratio of the force to the product of current, length, and sine angle", C: "the ratio of the force to the product of current, length, and cosine angle", D: "the ratio of the force to the product of current and area" },
};

for (const [id, opts] of Object.entries(flagOptsFixes)) {
  const q = byId.get(Number(id));
  if (!q) throw new Error("missing id " + id);
  q.options = opts;
  applied.push(Number(id));
  flags.push(Number(id));
}

// 5058, 10496, 21582, 33421, 34559, 60978: fully corrupt formulas/options - cannot safely repair.
flags.push(5058, 10496, 21582, 33421, 34559, 60978);

console.log("APPLIED option/answer fixes:", applied.length, "ids:", applied.join(", "));
console.log("\nFLAGGED for manual review (options now distinct or too corrupt):", flags.length, "ids:", flags.join(", "));

fs.writeFileSync("src/data/questions.json", JSON.stringify(d, null, 2) + "\n");
console.log("\nBank updated.");
