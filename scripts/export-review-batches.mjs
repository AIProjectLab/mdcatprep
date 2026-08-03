import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");
const outDir = path.join(root, "scripts", "review-batches");

// Official MDCAT syllabus units (same as src/lib/questions.ts)
const MDCAT_UNITS = {
  Biology: [
    "Acellular Life (Viruses, AIDS)", "Bioenergetics (Respiration)",
    "Biological Molecules (Water, Carbs, Proteins, Lipids, DNA/RNA)",
    "Cell Structure & Function", "Coordination & Control / Nervous & Chemical Coordination",
    "Enzymes", "Evolution", "Reproduction", "Support & Movement", "Inheritance",
    "Circulation", "Immunity", "Respiration", "Digestion",
    "Homeostasis (Kidney, Thermoregulation)", "Biotechnology",
  ],
  Chemistry: [
    "Fundamentals: Moles, Stoichiometry, Limiting Reactants and Yield", "Atomic Structure",
    "Gases", "Liquids and Hydrogen Bonding", "Solids and Crystal Lattice", "Chemical Equilibrium",
    "Reaction Kinetics", "Thermochemistry and Energetics", "Electrochemistry", "Chemical Bonding",
    "S- and P-Block Elements", "Transition Elements", "Fundamental Principles of Organic Chemistry",
    "Chemistry of Hydrocarbons", "Alkyl Halides", "Alcohols and Phenols", "Aldehydes and Ketones",
    "Carboxylic Acids", "Macromolecules", "Industrial Chemistry",
  ],
  Physics: [
    "Vectors and Equilibrium", "Force and Motion", "Work and Energy", "Rotational and Circular Motion",
    "Fluid Dynamics", "Waves", "Thermodynamics", "Electrostatics", "Current Electricity",
    "Electromagnetism", "Electromagnetic Induction", "Alternating Current", "Electronics",
    "Dawn of Modern Physics", "Atomic Spectra", "Nuclear Physics",
  ],
};

const bank = JSON.parse(fs.readFileSync(bankFile, "utf8"));

// Export only textbook questions (past papers are key-verified).
const textbook = bank.filter((q) => q.origin === "textbook");

// Report syllabus compliance per subject
console.log("=== SYLLABUS COMPLIANCE (textbook questions) ===");
for (const subject of ["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"]) {
  const subjQs = textbook.filter((q) => q.subject === subject);
  const inSyl = subjQs.filter((q) => {
    const units = MDCAT_UNITS[subject];
    return units && units.includes(q.unitLabel);
  });
  const untagged = subjQs.filter((q) => !q.unitLabel);
  const mislabeled = subjQs.filter((q) => q.unitLabel && !(MDCAT_UNITS[subject] || []).includes(q.unitLabel));
  console.log(
    `${subject}: total=${subjQs.length} in-syllabus=${inSyl.length} untagged=${untagged.length} mislabeled=${mislabeled.length}`
  );
}

// Write review batches (compact, one question per line, with review context)
fs.mkdirSync(outDir, { recursive: true });
const batchSize = 200;
const inSyllabus = textbook.filter((q) => {
  const units = MDCAT_UNITS[q.subject];
  return units && units.includes(q.unitLabel);
});

console.log(`\nExporting ${inSyllabus.length} in-syllabus textbook questions in batches of ${batchSize}`);
let batchIdx = 0;
for (let i = 0; i < inSyllabus.length; i += batchSize) {
  const batch = inSyllabus.slice(i, i + batchSize);
  const file = path.join(outDir, `batch-${String(batchIdx).padStart(3, "0")}.jsonl`);
  const lines = batch.map((q) =>
    JSON.stringify({
      id: q.id,
      subject: q.subject,
      unit: q.unitLabel,
      book: q.book,
      page: q.page,
      text: q.text,
      options: q.options,
      answer: q.answer,
    })
  );
  fs.writeFileSync(file, lines.join("\n") + "\n");
  batchIdx++;
}
console.log(`Wrote ${batchIdx} batch files to ${path.relative(root, outDir)}`);
console.log("Each line: one question with id, subject, unit, book, page, text, options, stored answer.");
