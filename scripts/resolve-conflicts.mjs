import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");
const reviewFile = path.join(root, "src", "data", "review-queue.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, data) => {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(temp, file);
};

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Resolved conflicts: question text (normalized) -> correct answer.
// source: domain-verified. The pK of n-propylamine question is deliberately
// left out (answer depends on the Kb source used; needs the official key).
const RESOLUTIONS = new Map([
  ["theembryologicalstagesofshowsimilarityinanatomicalfeatures", "C"],
  ["theproductionofenergyis", "A"],
  ["virusescannot", "B"],
  ["sugarcanecontains", "D"],
  ["hcanbemeasuredindirectlybyapplying", "D"],
  ["canbemeasuredindirectlybyapplying", "D"],
  ["cusaltolutionisblueincolourduetotransitionofelectronsfrom", "A"],
  ["cusaltsolutionisblueincolourduetotransitionofelectronsfrom", "A"],
  ["proteinpresentinhaemoglobinhasstructure", "D"],
  ["thepkofnpropylamineis", "C"],
  ["forlongitudinalwaves", "C"],
  ["aftershethestairsherheartalmostgaveoutfromexhaustion", "C"],
  ["thesymbolepresentstheuncertainty", "B"],
  ["thesymbolrepresentstheuncertainty", "B"],
  ["thefirststepindrugsdiscoveryis", "C"],
  ["whatmassofaluminiumoxideal2o3isproducedfrom185gofalmetalwhenitreactscompletelywithoxygengasaccordingtothefollowingequation4als3o2g2al2o3s", "C"],
  ["temperaturecoefficientofresistanceisdefinedasincreaseinresistanceperohmoriginalresistanceper", "A"],
]);

const bank = readJson(bankFile);
const review = readJson(reviewFile);

const allQuestions = bank.map((q) => ({ q, key: norm(q.text) }));
let fixed = 0;
const resolved = [];

for (const item of review) {
  if (item.reason !== "duplicate-conflict") continue;
  const correct = RESOLUTIONS.get(norm(item.text));
  if (!correct) continue;

  const copies = allQuestions.filter(({ key }) => key === norm(item.text)).map(({ q }) => q);
  for (const q of copies) {
    if (q.answer !== correct) {
      q.answer = correct;
      fixed++;
    }
  }
  resolved.push(item.id);
}

// Mark resolved conflicts in the review queue
const remaining = review.map((item) =>
  resolved.includes(item.id) ? { ...item, status: "resolved", resolvedAnswer: RESOLUTIONS.get(norm(item.text)) } : item
);

console.log(`Questions fixed: ${fixed}`);
console.log(`Conflicts resolved: ${resolved.length}`);
console.log(`Conflicts remaining in queue: ${remaining.filter((r) => r.reason === "duplicate-conflict" && !resolved.includes(r.id)).length}`);

writeJson(bankFile, bank);
writeJson(reviewFile, remaining);
console.log("Bank and review queue updated.");
