import fs from "node:fs";

const bankFile = "src/data/questions.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const q = d.find((x) => x.id === 173);

// Faraday's law: epsilon = -N (d phi / dt). Correct answer must be -N(dphi/dt).
// Original: A=-N(dB/dt), B=-N(dI/dt), C=-M(dphi/dt), D=-N(dphi/dt) [CORRECT], E=-M(dphi/dt) [dup of C]
// Fix: keep D as the correct answer, change E to a distinct distractor.
q.options = {
  A: "epsilon = -N (delta B / delta t)",
  B: "epsilon = -N (delta I / delta t)",
  C: "epsilon = -M (delta phi / delta t)",
  D: "epsilon = -N (delta phi / delta t)",
  E: "epsilon = -M (delta I / delta t)",
};
q.answer = "D";
console.log("173 corrected:", JSON.stringify(q.options));
console.log("answer:", q.answer);

fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
console.log("Bank updated.");
