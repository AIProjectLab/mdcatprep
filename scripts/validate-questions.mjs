import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src", "data", "questions.json");
const allowedSubjects = new Set(["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"]);
const questions = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const ids = new Set();

for (const [index, q] of questions.entries()) {
  const label = `item ${index + 1}`;
  if (!Number.isInteger(q.id)) errors.push(`${label}: id must be an integer`);
  if (ids.has(q.id)) errors.push(`${label}: duplicate id ${q.id}`);
  ids.add(q.id);
  if (!allowedSubjects.has(q.subject)) errors.push(`${label}: invalid subject "${q.subject}"`);
  if (q.origin !== undefined && !["past-paper", "textbook"].includes(q.origin)) errors.push(`${label}: invalid origin "${q.origin}"`);
  if (!q.text?.trim()) errors.push(`${label}: missing text`);
  if (!q.source?.trim()) errors.push(`${label}: missing source`);
  if (!Number.isInteger(q.year) || q.year < 0) errors.push(`${label}: invalid year`);
  const optionKeys = Object.keys(q.options ?? {}).sort();
  if (!["A", "B", "C", "D"].every((key) => optionKeys.includes(key))) errors.push(`${label} (id ${q.id}): options must include A, B, C, and D`);
  if (!q.answer || typeof q.answer !== "string" || !optionKeys.includes(q.answer)) errors.push(`${label} (id ${q.id}): answer must match one of the option keys`);
}

if (errors.length) {
  console.error(`Question validation failed with ${errors.length} issue(s):`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Question bank valid: ${questions.length} questions.`);
