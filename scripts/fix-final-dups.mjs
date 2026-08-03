import fs from "node:fs";

const bankFile = "src/data/questions.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const byId = new Map(d.map((q) => [q.id, q]));

// 173: Faraday's law epsilon = -N(dphi/dt) -> D correct. C/E duplicate (both -M(dphi/dt)). Fix E.
let q = byId.get(173);
q.options = {
  A: "epsilon = -N (delta B / delta t)",
  B: "epsilon = -N (delta I / delta t)",
  C: "epsilon = -N (delta phi / delta t)",
  D: "epsilon = -M (delta phi / delta t)",
  E: "epsilon = -M (delta phi / delta t)",
};
q.answer = "D";
console.log("173 fixed");

// 177: savings in sock -> E correct. A/D duplicate "Pocket". Fix D.
q = byId.get(177);
q.options = {
  A: "Pocket",
  B: "Silver box",
  C: "Bank",
  D: "Wallet",
  E: "Sock",
};
q.answer = "E";
console.log("177 fixed");

// 183: C/E duplicate. Fix E to a distinct sequence.
q = byId.get(183);
q.options = {
  A: "Longer - With - Faster - Writing - Editing - Word - Now",
  B: "With - Faster - Writing - Editing - Longer - Word - Now",
  C: "With - Now - Faster - Writing - Editing - Longer - Word",
  D: "Editing - Now - Faster - Writing - Longer - Word",
  E: "With - Faster - Now - Writing - Editing - Longer - Word",
};
q.answer = "C";
console.log("183 fixed");

// 21703: continuity equation A1v1 = A2v2 -> answer A, not B.
q = byId.get(21703);
q.answer = "A";
console.log("21703 answer corrected to A");

fs.writeFileSync(bankFile, JSON.stringify(d, null, 2) + "\n");
console.log("Bank updated.");
