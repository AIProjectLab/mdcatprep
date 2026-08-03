import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = path.join(root, "src", "data", "questions.json");

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\(bumhs-2025\s+by\s+medix\)/gi, "")
    .replace(/[^a-z0-9]/g, "");

const bank = JSON.parse(fs.readFileSync(bankFile, "utf8"));

// ---- Load official answer keys ----
// Key files are JSON arrays: [{ num, text, options, answer }]
const keysDir = path.join(root, "scripts", "keys");
const keySources = [];

if (fs.existsSync(keysDir)) {
  for (const f of fs.readdirSync(keysDir)) {
    if (!f.endsWith(".json")) continue;
    const arr = JSON.parse(fs.readFileSync(path.join(keysDir, f), "utf8"));
    keySources.push({ file: f, items: arr });
  }
}

if (keySources.length === 0) {
  console.log("No key files found in scripts/keys/. Add official answer keys there.");
  console.log("Each file: [{ num, text, options: {A..D}, answer }]");
  process.exit(1);
}

// ---- Build normalized index of official answers ----
// Match by question text (normalized). Some keys may match by number too.
const official = new Map(); // normText -> { answer, source, num, options }
const byNumber = new Map(); // "source|num" -> answer

for (const ks of keySources) {
  for (const it of ks.items) {
    const t = norm(it.text);
    if (!official.has(t)) {
      official.set(t, { answer: it.answer, source: ks.file, num: it.num, options: it.options });
    }
    byNumber.set(`${ks.file}|${it.num}`, it.answer);
  }
}

// ---- Match bank questions against official keys ----
// Match by normalized text AND options (different boards reuse stems with different options)
const optNorm = (o) => {
  const ks = Object.keys(o).sort();
  return JSON.stringify(ks.map((k) => norm(o[k])));
};

const matches = [];
const mismatches = [];
const unmatched = [];

for (const q of bank) {
  if (q.origin !== "past-paper") continue; // only verify past papers
  const t = norm(q.text);
  const on = optNorm(q.options);
  const off = official.get(t);
  // require option set to also match (avoid false matches across different questions)
  if (!off || optNorm(off.options) !== on) {
    unmatched.push(q);
    continue;
  }
  if (q.answer === off.answer) {
    matches.push(q);
  } else {
    mismatches.push({ q, official: off.answer });
  }
}

console.log("=== PAST-PAPER VERIFICATION AGAINST OFFICIAL KEYS ===");
console.log("past-paper questions in bank:", bank.filter((q) => q.origin === "past-paper").length);
console.log("matched to official key:", matches.length);
console.log("ANSWER MISMATCHES:", mismatches.length);
console.log("unmatched (no key for them):", unmatched.length);

if (mismatches.length) {
  console.log("\n--- MISMATCHES (bank answer != official key) ---");
  for (const { q, official } of mismatches) {
    console.log(`id ${q.id} | ${q.source} | bank=${q.answer} official=${official}`);
    console.log(`   ${q.text.slice(0, 90)}`);
    console.log(`   opts: ${Object.values(q.options).join(" | ")}`);
  }
}
