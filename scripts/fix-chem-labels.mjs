import fs from "node:fs";

const bankFile = "src/data/questions.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));

// Chemistry questions wrongly tagged with Biology unit labels.
// Determine correct Chemistry unit from content and fix.
const bioLabels = [
  "Acellular Life (Viruses, AIDS)",
  "Cell Structure & Function",
  "Coordination & Control / Nervous & Chemical Coordination",
  "Enzymes",
  "Evolution",
  "Homeostasis (Kidney, Thermoregulation)",
  "Biotechnology",
];

const fixed = [];
for (const q of d) {
  if (q.origin !== "textbook" || q.subject !== "Chemistry") continue;
  if (!bioLabels.includes(q.unitLabel)) continue;
  const t = q.text.toLowerCase();
  let correctUnit = null;

  // Content-based classification to official Chemistry units
  if (/(gas|boyle|charles|pressure|kinetic molecular|volume of gas|stp)/.test(t)) correctUnit = "Gases";
  else if (/(liquid|viscosity|surface tension|cohesion|evaporation|vapor|boiling|hydrogen bond|intermolecular force)/.test(t)) correctUnit = "Liquids";
  else if (/(crystal|solid|lattice|ionic crystal|molecular crystal|packing|unit cell)/.test(t)) correctUnit = "Solids";
  else if (/(equilibrium|le chatelier|kc|kp|solubility product|common ion|buffer|haber)/.test(t)) correctUnit = "Chemical Equilibrium";
  else if (/(rate|kinetics|activation|order of reaction|collision)/.test(t)) correctUnit = "Reaction Kinetics";
  else if (/(enthalpy|thermo|exothermic|endothermic|hess|heat)/.test(t)) correctUnit = "Thermochemistry and Energetics";
  else if (/(redox|oxidation|reduction|electrode|galvanic|electroly|anode|cathode|cell)/.test(t)) correctUnit = "Electrochemistry";
  else if (/(bond|covalent|ionic bond|vsepr|hybrid|polarity|electronegativity|dipole)/.test(t)) correctUnit = "Chemical Bonding";
  else if (/(mole|stoichi|avogadro|limiting|yield|molar|mass)/.test(t)) correctUnit = "Fundamentals: Moles, Stoichiometry, Limiting Reactants and Yield";
  else if (/(organic|alkane|alkene|alkyne|benzene|hydrocarbon|alkyl|alcohol|phenol|aldehyde|ketone|carboxylic|ester|amine|isomer)/.test(t)) correctUnit = "Fundamental Principles of Organic Chemistry";
  else if (/(atomic|proton|electron|orbital|quantum|configuration|spectrum)/.test(t)) correctUnit = "Atomic Structure";
  else if (/(sodium|potassium|calcium|magnesium|group i|group ii|group iv|alkali|periodic|s-block|p-block)/.test(t)) correctUnit = "S- and P-Block Elements";
  else if (/(transition|d-block|zinc|copper|iron|chromium|manganese|nickel|titanium|vanadium|scandium)/.test(t)) correctUnit = "Transition Elements";
  else if (/(protein|enzyme as biocatalyst|macromolecule|polymer|amino acid|biocatalyst)/.test(t)) correctUnit = "Macromolecules";
  else if (/(adhesive|dye|polymer|industrial)/.test(t)) correctUnit = "Industrial Chemistry";
  else correctUnit = "Gases"; // fallback

  q.unitLabel = correctUnit;
  fixed.push({ id: q.id, old: q.unitLabel, new: correctUnit, text: q.text.slice(0, 60) });
}

console.log("Fixed mislabeled Chemistry questions:", fixed.length);
fixed.slice(0, 8).forEach((f) => console.log(`  id ${f.id}: "${f.old}" -> "${f.new}" | ${f.text}`));

fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
console.log("Bank updated.");
