import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, data) => {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(temp, file);
};

const bank = readJson(bankFile);
const byId = new Map(bank.map((q) => [q.id, q]));

const changes = [];
const apply = (id, patch) => {
  const q = byId.get(id);
  if (!q) throw new Error(`Question ${id} not found`);
  const before = JSON.stringify({ text: q.text, answer: q.answer });
  Object.assign(q, patch);
  const after = JSON.stringify({ text: q.text, answer: q.answer });
  if (before !== after) changes.push({ id, before, after });
};

// 1. id 61448: complete the truncated income question (verified from BUMHS solved PDF Q.177)
apply(61448, { text: "If a person earns Rs. 1000 in the first week and their income doubles each week, how much will they earn in the 4th week?" });

// 2. id 61389: complete the truncated Na/Cl2 question (verified from BUMHS solved PDF Q.118)
apply(61389, { text: "Consider the reaction: 2Na + Cl₂ →2NaCl. If 4 moles of Na and 2 moles of Cl₂ are reacted, how much Cl₂ will remain unreacted?" });

// 3. id 837: correct wrong answer D -> A (stoichiometry: 4 mol Na consumes exactly 2 mol Cl2, 0 remains)
apply(837, { answer: "A" });

// 4. id 61595: correct wrong answer A -> D (protons held together by Strong Nuclear Force)
apply(61595, { answer: "D" });

console.log(`Applied ${changes.length} fix(es):`);
for (const c of changes) {
  console.log(`- id ${c.id}`);
  console.log(`  before: ${c.before}`);
  console.log(`  after:  ${c.after}`);
}

writeJson(bankFile, bank);
console.log("Bank updated.");
