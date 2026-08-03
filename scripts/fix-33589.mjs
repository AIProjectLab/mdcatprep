import fs from "node:fs";

const bankFile = "src/data/questions.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));

// Fix 33589: enthalpy of solution = -lattice + hydration (A correct).
// Ensure all 4 options distinct.
const q33589 = d.find((x) => x.id === 33589);
q33589.options = {
  A: "-ΔH_lattice + ΔH_hydration",
  B: "ΔH_lattice - ΔH_hydration",
  C: "-ΔH_lattice - ΔH_hydration",
  D: "+ΔH_lattice + ΔH_hydration",
};
q33589.answer = "A";
console.log("33589 fixed:", JSON.stringify(q33589.options));

fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
console.log("Bank updated.");
