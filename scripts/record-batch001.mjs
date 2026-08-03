import fs from "node:fs";

// Batch-001 review findings
const findings = [
  // ---- CONFIRMED WRONG ANSWERS (domain-verified with calculations) ----
  { id: 10172, type: "WRONG-ANSWER", note: "Mole fraction methanol = 1.46/(1.46+2.19) = 0.400. Stored B(0.57) wrong, closest D(0.42)", correct: "D" },
  { id: 10210, type: "WRONG-ANSWER", note: "Molarity of pure water = 1000/18 = 55.6M. Stored B(18) wrong, correct D(55.6)", correct: "D" },
  { id: 10270, type: "WRONG-ANSWER", note: "S in H2SO4 = +6 (2+1 + S + 4(-2)=0). Stored B(-2) wrong, correct A(+6)", correct: "A" },
  { id: 10286, type: "WRONG-ANSWER", note: "Zn standard potential = -0.76V. Stored B(0.76) wrong, correct A(-0.76)", correct: "A" },
  { id: 10326, type: "WRONG-ANSWER", note: "Zn(-0.76) > Al(-1.66) reduction potential. Stored B(Zn<Al) wrong, correct A(Zn>Al)", correct: "A" },
  { id: 10324, type: "WRONG-ANSWER", note: "Reduction = gain electrons. Br2->2Br- (A). Stored C(Zn->Zn2+ oxidation) wrong", correct: "A" },
  { id: 10327, type: "WRONG-ANSWER", note: "Ions liberated are DISCHARGED (D). Stored C(charged) wrong", correct: "D" },
  { id: 10257, type: "WRONG-ANSWER", note: "For solids/liquids DH=DE (P DV ~ 0). Stored D(=0) wrong, correct A(=DE)", correct: "A" },
  { id: 10312, type: "WRONG-ANSWER", note: "Rust: Fe2+ reacts with O2 (C). Stored D(Fe3+) wrong - Fe2+ is oxidized by O2", correct: "C" },

  // ---- WRONG ANSWER (question flawed - multiple correct options) ----
  { id: 10223, type: "WRONG-ANSWER-FLAWED", note: "H2+I2->2HI is ENDOTHERMIC (stored A wrong). B/C/D are all exothermic - 3 correct options. Fix answer to B (CH4 combustion)", correct: "B" },

  // ---- FLAWED QUESTIONS (no correct option among choices) ----
  { id: 10171, type: "FLAWED-QUESTION", note: "Molality = 0.499/0.250 = 1.99m, no option matches (0.34,0.67,0.90,1.20). Stored B(0.67) wrong. Question flawed" },

  // ---- QUESTIONABLE (both C and D true; D is classic MDCAT answer) ----
  { id: 10143, type: "CHECK-ANSWER", note: "Temp increase: C(increase KE) vs D(more molecules attain Ea). Both true, D is classic answer. Stored C debatable" },
];

console.log("Batch-001 findings:", findings.length);
const byType = {};
for (const f of findings) byType[f.type] = (byType[f.type] || 0) + 1;
console.log("by type:", JSON.stringify(byType));

fs.writeFileSync("scripts/review-findings.json", JSON.stringify(findings, null, 2));
console.log("Written scripts/review-findings.json");
