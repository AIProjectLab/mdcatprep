import fs from "node:fs";

const bankFile = "src/data/questions.json";
const reviewFile = "src/data/review-queue.json";
const d = JSON.parse(fs.readFileSync(bankFile, "utf8"));
const rq = JSON.parse(fs.readFileSync(reviewFile, "utf8"));

const byId = new Map(d.map((q) => [q.id, q]));

// ---- 33846: N2O structure - fix options distinct + correct answer to A ----
{
  const q = byId.get(33846);
  q.options = { A: ":N≡N—O:", B: ":N=N=O:", C: ":N=N—O:", D: ":N—N—O:" };
  q.answer = "A";
  console.log("33846: fixed N2O -> answer A (:N≡N—O:)");
}

// ---- 33421: ionization energy order - fix options distinct + correct answer to B ----
{
  const q = byId.get(33421);
  q.options = { A: "He > Mg > N > O", B: "He > F > N > O > Mg", C: "He > Ne > F > O", D: "N > F > He > O > Mg" };
  q.answer = "B";
  console.log("33421: fixed IE order -> answer B (He > F > N > O > Mg)");
}

// ---- Remove unrecoverable/corrupt questions ----
const removeIds = [5058, 10496, 21582, 34559, 58767, 60978];
const kept = [];
let removedCount = 0;
for (const q of d) {
  if (removeIds.includes(q.id)) {
    rq.push({
      id: q.id,
      reason: "corrupt-options",
      subject: q.subject,
      source: q.source,
      text: q.text,
      options: q.options,
      answer: q.answer,
      note: "Options unreadable/corrupt or question truncated - removed from bank",
    });
    removedCount++;
  } else {
    kept.push(q);
  }
}
console.log("Removed:", removedCount, "ids:", removeIds.join(", "));

fs.writeFileSync(bankFile, JSON.stringify(kept, null, 2) + "\n");
fs.writeFileSync(reviewFile, JSON.stringify(rq, null, 2) + "\n");
console.log("Bank:", kept.length, "| Review queue:", rq.length);
