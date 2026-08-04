import fs from "node:fs";

// Official PMDC units from the extracted syllabus (exact names as printed)
const official = {
  Biology: ["Acellular Life", "Bioenergetics", "Biological Molecules", "Cell Structure & Function", "Coordination & Control / Nervous & Chemical Coordination", "Enzymes", "Evolution", "Reproduction", "Support & Movement", "Inheritance", "Circulation", "Immunity", "Respiration", "Digestion", "Homeostasis", "Biotechnology"],
  Chemistry: ["Fundamentals: Moles, Stoichiometry, Limiting Reactants and Yield", "Atomic Structure", "Gases", "Liquids", "Solids", "Chemical Equilibrium", "Reaction Kinetics", "Thermochemistry and Energetics", "Electrochemistry", "Chemical Bonding", "S- and P-Block Elements", "Transition Elements", "Fundamental Principles of Organic Chemistry", "Chemistry of Hydrocarbons", "Alkyl Halides", "Alcohols and Phenols", "Aldehydes and Ketones", "Carboxylic Acids", "Macromolecules", "Industrial Chemistry"],
  Physics: ["Vectors and Equilibrium", "Force and Motion", "Work and Energy", "Rotational and Circular Motion", "Fluid Dynamics", "Waves", "Thermodynamics", "Electrostatics", "Current Electricity", "Electromagnetism", "Electromagnetic Induction", "Alternating Current", "Electronics", "Dawn of Modern Physics", "Atomic Spectra", "Nuclear Physics"],
};

const src = fs.readFileSync("src/lib/questions.ts", "utf8");
const m = src.match(/MDCAT_UNITS: Record<Subject, Set<string>> = \{([\s\S]*?)\n\};/);
if (!m) { console.log("could not parse MDCAT_UNITS"); process.exit(1); }

const block = m[1];
// split by subject lines like "  Biology: new Set(["
const parts = block.split(/\n\s+(\w+): new Set\(\[/).slice(1);
for (let i = 0; i < parts.length; i += 2) {
  const subj = parts[i];
  const body = parts[i + 1] || "";
  const labels = [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const off = official[subj] || [];
  console.log(`=== ${subj}: code has ${labels.length}, official has ${off.length} ===`);
  const missing = off.filter((o) => !labels.includes(o));
  const extra = labels.filter((l) => !off.includes(l));
  if (missing.length) console.log("  MISSING from code:", JSON.stringify(missing));
  if (extra.length) console.log("  EXTRA in code:", JSON.stringify(extra));
  if (!missing.length && !extra.length) console.log("  MATCHES official");
}
