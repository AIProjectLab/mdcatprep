import fs from "node:fs";

// Batch-000 review findings
// Categories:
// 1. WRONG-ANSWER: stored answer is incorrect (domain-verified)
// 2. MISLABELED-SUBJECT: chemistry/physics question tagged as Biology
// 3. CHECK-ANSWER: answer uncertain, needs verification
const findings = [
  // ---- MISLABELED-SUBJECT: KPK Chemistry questions tagged as Biology ----
  // ids 9860-9974 range (chemistry content: crystal lattice, equilibrium, liquids)
  // These are tagged subject=Biology but are chemistry questions from KPK Chemistry 11th book.
  // Actually many are tagged with Biology units like "Homeostasis", "Enzymes", "Evolution", "Acellular Life".
  { id: 9964, type: "MISLABELED-SUBJECT", note: "Chemistry anisotropy question under Biology/Homeostasis from KPK Chemistry book" },

  // ---- WRONG-ANSWER checks ----
  // id 9972: 'Which is INCORRECT about chemical equilibrium?' ans C
  //   C says: "The equilibrium constant (K) changes with temperature but not concentration."
  //   This statement is actually TRUE. The INCORRECT one should be D (Le Chatelier CAN be applied).
  //   Wait - D: "Le Chatelier's principle can be applied to predict shifts" - that's TRUE.
  //   A: "forward/reverse rates equal at equilibrium" - TRUE
  //   B: "concentrations remain constant" - TRUE
  //   C: "K changes with temperature but not concentration" - TRUE
  //   ALL statements are true! No incorrect option. This question is flawed.
  { id: 9972, type: "FLAWED-QUESTION", note: "All 4 options are correct statements; no incorrect option exists" },

  // id 10023: K = [N2][O2]/[NO]^2 ans A
  //   For N2 + O2 <=> 2NO, correct Kc = [NO]^2/([N2][O2]). Stored A is INVERTED.
  { id: 10023, type: "WRONG-ANSWER", note: "Kc for N2+O2<=>2NO should be [NO]^2/[N2][O2] (option C), stored A is inverted", correct: "C" },

  // id 10030: 'Kc defined as ratio of product of ___ to that of reactants' ans A
  //   Correct = molar concentrations (A) OR active masses (B)? Kc uses concentrations, Kp uses pressures.
  //   Stored A (molar concentrations) is fine.
  //   No flag.

  // id 10033: 'yield of SO3 increased by' ans B (adding a catalyst)
  //   A catalyst increases rate, NOT equilibrium yield. Correct should be C (adding more SO2)
  //   or increasing pressure. Stored B is wrong for yield.
  { id: 10033, type: "WRONG-ANSWER", note: "Catalyst increases rate not yield; adding more SO2 (C) increases yield. Stored B wrong", correct: "C" },

  // id 10043: 'INCORRECT about buffer solutions' ans A
  //   A: "Buffers maintain pH by donating protons" - hmm, this is roughly true (buffers donate/accept H+)
  //   D: "Buffers cannot neutralize strong acid or base additions" - this is FALSE (they can)
  //   Stored A is questionable; the clearly INCORRECT is D.
  { id: 10043, type: "WRONG-ANSWER", note: "D ('buffers cannot neutralize strong acid/base') is the false statement; stored A questionable", correct: "D" },

  // id 10052: 'weakest acid' ans B (H2SO3)
  //   Options: HClO4 (strong), H2SO3 (weak, Ka~1.7e-2), HF (weak, Ka~6.8e-4), HNO3 (strong)
  //   HF is weaker than H2SO3! Correct = C (HF). Stored B wrong.
  { id: 10052, type: "WRONG-ANSWER", note: "HF (Ka~6.8e-4) is weaker than H2SO3 (Ka~1.7e-2). Correct = C, stored B", correct: "C" },

  // id 10066: 'pH of vinegar' ans D (1)
  //   Vinegar pH ~2.3-2.5. Option A (2.3) is correct. Stored D (1) wrong.
  { id: 10066, type: "WRONG-ANSWER", note: "Vinegar pH ~2.3 (A), stored D (1) wrong", correct: "A" },

  // id 10089: 'Brønsted base accepts proton to form ___' ans B (conjugate base)
  //   A base accepts a proton to form its CONJUGATE ACID. Stored B wrong.
  { id: 10089, type: "WRONG-ANSWER", note: "Base accepts proton -> conjugate ACID (option A). Stored B wrong", correct: "A" },

  // id 10093: 'conjugate base of a weak acid is' ans A
  //   A: "species that donates an electron pair to the acid" - this is a Lewis description, wrong.
  //   D: "species formed by removing a proton from the acid" - CORRECT definition of conjugate base.
  { id: 10093, type: "WRONG-ANSWER", note: "Conjugate base = species formed by removing proton (D). Stored A wrong", correct: "D" },

  // id 10097: '1M Ca(OH)2 mixed with 1M HCl' ans C (Neutral)
  //   Ca(OH)2 provides 2 OH- per formula = 2M OH-. HCl = 1M H+. OH- in excess -> Basic (B).
  { id: 10097, type: "WRONG-ANSWER", note: "Ca(OH)2 1M gives 2M OH- vs 1M H+ -> basic (B). Stored C (neutral) wrong", correct: "B" },

  // id 10099: 'pH 9, pOH is' ans A (11)
  //   pH + pOH = 14, so pOH = 5 (option D). Stored A (11) WRONG.
  { id: 10099, type: "WRONG-ANSWER", note: "pOH = 14-9 = 5 (D). Stored A (11) wrong", correct: "D" },

  // id 10100: 'salt of weak base + strong acid has pH approximately' ans C (7)
  //   Salt of weak base + strong acid is ACIDIC (pH < 7). Correct ~6 (B). Stored C wrong.
  { id: 10100, type: "WRONG-ANSWER", note: "Weak base + strong acid salt is acidic ~6 (B). Stored C (7) wrong", correct: "B" },

  // id 10102: 'pKa if [H+] = 1.35e-5' ans A (9.87)
  //   pH = -log(1.35e-5) = 4.87 (option B). Stored A (9.87) wrong.
  { id: 10102, type: "WRONG-ANSWER", note: "pH = -log(1.35e-5) = 4.87 (B). Stored A (9.87) wrong", correct: "B" },

  // id 10136: 'rate = k[A]^2[B], order w.r.t [B]' ans B (2)
  //   Order w.r.t [B] is the exponent of [B] = 1 (option A). Stored B (2) WRONG.
  { id: 10136, type: "WRONG-ANSWER", note: "Order w.r.t [B] = exponent 1 (A). Stored B (2) wrong", correct: "A" },

  // id 10113: 'rate of reaction defined as' ans A
  //   A: "Rate = change in product concentration / time" - correct definition.
  //   C: "Rate = -Δ[reactant]/Δt" - also correct. D: incomplete. A is fine. No flag.

  // id 10034: 'Le Chatelier's principle applies to' ans C (chemical system)
  //   Le Chatelier applies to BOTH physical and chemical systems (D: both b and c).
  //   Stored C is arguably incomplete; D is more correct.
  { id: 10034, type: "WRONG-ANSWER", note: "Le Chatelier applies to both physical AND chemical (D). Stored C (chemical only) incomplete", correct: "D" },

  // id 10097 double-checked. 

  // id 1246: 'technique for isolating/examining cell components' ans B (Differential Staining)
  //   Centrifugation (C) is the technique for ISOLATING cell components (cell fractionation).
  //   Differential staining is for examining/slides. Stored B questionable -> C.
  { id: 1246, type: "WRONG-ANSWER", note: "Centrifugation (C) isolates cell components. Stored B (staining) wrong", correct: "C" },

  // id 1235: 'NOT a function of enzymes' ans D (Storage)
  //   Options: Catalysis, Transportation, Regulation, Storage. Enzymes catalyze, some transport, regulate.
  //   Storage is not an enzyme function. Stored D correct. No flag.
];

console.log("Findings for batch-000:", findings.length);
const byType = {};
for (const f of findings) byType[f.type] = (byType[f.type] || 0) + 1;
console.log("by type:", JSON.stringify(byType));

fs.writeFileSync("scripts/review-findings.json", JSON.stringify(findings, null, 2));
console.log("Written scripts/review-findings.json");
