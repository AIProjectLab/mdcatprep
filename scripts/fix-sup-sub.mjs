import fs from "node:fs";

const bankFile = "src/data/questions.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));

// Unicode superscripts for digits and common symbols
const SUP_DIGITS = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻" };
const SUB_DIGITS = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

const toSup = (s) => s.split("").map((c) => SUP_DIGITS[c] ?? c).join("");
const toSub = (s) => s.split("").map((c) => SUB_DIGITS[c] ?? c).join("");

// Fix one piece of text: convert <sup>..</sup> and <sub>..</sub> to unicode where
// possible, else plain inline text. Handles nested letter subscripts like P<sub>obs</sub>.
function fixText(t) {
  return t
    .replace(/<sup>([^<]*)<\/sup>/g, (_, inner) => toSup(inner))
    .replace(/<sub>([^<]*)<\/sub>/g, (_, inner) => toSub(inner));
}

let fixed = 0;
const changes = [];
for (const q of d) {
  const beforeText = q.text;
  const beforeOpts = JSON.stringify(q.options);
  const newText = fixText(beforeText);
  const newOpts = {};
  for (const [k, v] of Object.entries(q.options)) newOpts[k] = fixText(v);
  const afterOpts = JSON.stringify(newOpts);

  if (newText !== beforeText || afterOpts !== beforeOpts) {
    changes.push({ id: q.id, subject: q.subject, text: newText });
    q.text = newText;
    q.options = newOpts;
    fixed++;
  }
}

console.log(`Fixed ${fixed} questions.`);
if (fixed > 0) {
  // show a couple examples
  changes.slice(0, 4).forEach((c) => console.log("id", c.id, c.subject, "|", c.text.slice(0, 90)));
  fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
  console.log("Bank updated.");
}
