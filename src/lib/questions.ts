import questionsData from "@/data/questions.json";

export type Subject = "Biology" | "Chemistry" | "Physics" | "English" | "Logical Reasoning";

export interface Question {
  id: number;
  subject: Subject;
  year: number;
  source: string;
  origin?: "past-paper" | "textbook";
  unit?: number;
  unitLabel?: string;
  book?: string;
  page?: number;
  text: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
}

export interface TestConfig {
  totalMcqs: number;
  subjects: { subject: Subject; count: number }[];
  label: string;
}

// Official PMDC MDCAT syllabus unit labels (must match unitLabel values in data)
const MDCAT_UNITS: Record<Subject, Set<string>> = {
  Biology: new Set([
    "Acellular Life",
    "Acellular Life (Viruses, AIDS)",
    "Bioenergetics",
    "Bioenergetics (Respiration)",
    "Biological Molecules",
    "Biological Molecules (Water, Carbs, Proteins, Lipids, DNA/RNA)",
    "Cell Structure & Function",
    "Coordination & Control / Nervous & Chemical Coordination",
    "Enzymes",
    "Evolution",
    "Reproduction",
    "Support & Movement",
    "Inheritance",
    "Circulation",
    "Immunity",
    "Respiration",
    "Digestion",
    "Homeostasis",
    "Homeostasis (Kidney, Thermoregulation)",
    "Biotechnology",
  ]),
  Chemistry: new Set([
    "Fundamentals: Moles, Stoichiometry, Limiting Reactants and Yield",
    "Atomic Structure",
    "Gases",
    "Liquids",
    "Liquids and Hydrogen Bonding",
    "Solids",
    "Solids and Crystal Lattice",
    "Chemical Equilibrium",
    "Reaction Kinetics",
    "Thermochemistry and Energetics",
    "Electrochemistry",
    "Chemical Bonding",
    "S- and P-Block Elements",
    "Transition Elements",
    "Fundamental Principles of Organic Chemistry",
    "Chemistry of Hydrocarbons",
    "Alkyl Halides",
    "Alcohols and Phenols",
    "Aldehydes and Ketones",
    "Carboxylic Acids",
    "Macromolecules",
    "Industrial Chemistry",
  ]),
  Physics: new Set([
    "Vectors and Equilibrium",
    "Force and Motion",
    "Work and Energy",
    "Rotational and Circular Motion",
    "Fluid Dynamics",
    "Waves",
    "Thermodynamics",
    "Electrostatics",
    "Current Electricity",
    "Electromagnetism",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electronics",
    "Dawn of Modern Physics",
    "Atomic Spectra",
    "Nuclear Physics",
  ]),
  English: new Set(),
  "Logical Reasoning": new Set(),
};

// TEMPORARY SAFETY SWITCH
// While the textbook question bank is being corrected, all tests are built from
// REAL PAST-PAPER questions only (custom papers, free 30-MCQ, full 180-MCQ, daily).
// Set to false to re-enable syllabus-tagged textbook questions once the bank is fixed.
export const PAST_PAPERS_ONLY = true;

// TEMPORARY SAFETY SWITCH
// While the question bank is limited to past papers, paid Pro access is paused so
// students are not asked to pay for content that is temporarily reduced.
// Set to false to re-enable the payment/paywall once the bank is fully restored.
export const PAYMENTS_DISABLED = true;

// A question is usable in MDCAT tests if:
//  - it is a real past paper (always in syllabus), OR
//  - (when PAST_PAPERS_ONLY is false) it is a textbook question tagged with an official MDCAT unit
export function isInSyllabus(q: Question): boolean {
  if (q.origin === "past-paper") return true;
  if (PAST_PAPERS_ONLY) return false;
  if (q.origin !== "textbook") return false;
  const label = q.unitLabel;
  if (!label) return false;
  const units = MDCAT_UNITS[q.subject];
  return !!units && units.has(label);
}

export function getTextbookQuestions(subject?: Subject, source?: string): Question[] {
  return (questionsData as Question[]).filter((q) => {
    const isTextbook = q.origin === "textbook";
    const inSyllabus = isInSyllabus(q);
    const matchesSubject = !subject || q.subject === subject;
    const matchesSource = !source || q.source === source;
    return isTextbook && inSyllabus && matchesSubject && matchesSource;
  });
}

export function getTextbookSources(): string[] {
  return [...new Set(getTextbookQuestions().map((q) => q.source))].sort();
}

export function generateTextbookTest(count: number, subjects: Subject[], sources: string[]): { questions: Question[]; config: TestConfig } {
  const requested = Math.max(1, Math.min(500, Math.round(count)));
  const subjectFilter = subjects.length ? subjects : undefined;
  const sourceFilter = sources.length ? sources : undefined;
  const pool = getTextbookQuestions().filter((q) =>
    (!subjectFilter || subjectFilter.includes(q.subject)) &&
    (!sourceFilter || sourceFilter.includes(q.source))
  );
  const questions = shuffle(pool).slice(0, Math.min(requested, pool.length));
  const bySubject = new Map<Subject, number>();
  for (const q of questions) bySubject.set(q.subject, (bySubject.get(q.subject) || 0) + 1);
  return {
    questions,
    config: {
      label: "Textbook Practice",
      totalMcqs: questions.length,
      subjects: [...bySubject.entries()].map(([subject, subjectCount]) => ({ subject, count: subjectCount })),
    },
  };
}

const MODES: Record<string, TestConfig> = {
  free: {
    label: "Free Diagnostic",
    totalMcqs: 30,
    subjects: [
      { subject: "Biology", count: 14 },
      { subject: "Chemistry", count: 7 },
      { subject: "Physics", count: 6 },
      { subject: "English", count: 2 },
      { subject: "Logical Reasoning", count: 1 },
    ],
  },
  full: {
    label: "Full Test",
    totalMcqs: 180,
    subjects: [
      { subject: "Biology", count: 81 },
      { subject: "Chemistry", count: 45 },
      { subject: "Physics", count: 36 },
      { subject: "English", count: 9 },
      { subject: "Logical Reasoning", count: 9 },
    ],
  },
  "2025": {
    label: "2025 Past Paper Exam",
    totalMcqs: 180,
    subjects: [
      { subject: "Biology", count: 81 },
      { subject: "Chemistry", count: 45 },
      { subject: "Physics", count: 36 },
      { subject: "English", count: 9 },
      { subject: "Logical Reasoning", count: 9 },
    ],
  },
  half: {
    label: "Half Test",
    totalMcqs: 90,
    subjects: [
      { subject: "Biology", count: 40 },
      { subject: "Chemistry", count: 23 },
      { subject: "Physics", count: 18 },
      { subject: "English", count: 5 },
      { subject: "Logical Reasoning", count: 4 },
    ],
  },
  quick: {
    label: "Quick Practice",
    totalMcqs: 30,
    subjects: [
      { subject: "Biology", count: 30 },
    ],
  },
  daily: {
    label: "Daily 30-MCQ Challenge",
    totalMcqs: 30,
    subjects: [
      { subject: "Biology", count: 4 },
      { subject: "Chemistry", count: 2 },
      { subject: "Physics", count: 2 },
      { subject: "English", count: 1 },
      { subject: "Logical Reasoning", count: 1 },
    ],
  },
  demo: {
    label: "Demo Test",
    totalMcqs: 10,
    subjects: [
      { subject: "Biology", count: 10 },
    ],
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getSubjectQuestions(subject: Subject): Question[] {
  return (questionsData as Question[]).filter(
    (q) => q.subject === subject && isInSyllabus(q)
  );
}

// Real MDCAT past papers from the 2025 exams only (all 5 boards)
export function get2025Questions(subject: Subject): Question[] {
  return (questionsData as Question[]).filter(
    (q) =>
      q.subject === subject &&
      q.origin === "past-paper" &&
      q.year === 2025 &&
      isInSyllabus(q)
  );
}

export function getQuestionUnits(subject?: Subject): { unit: number; label: string }[] {
  const seen = new Map<number, string>();
  for (const q of questionsData as Question[]) {
    if (subject && q.subject !== subject || !Number.isInteger(q.unit)) continue;
    if (!isInSyllabus(q)) continue;
    if (!seen.has(q.unit!)) seen.set(q.unit!, q.unitLabel || `Unit ${q.unit}`);
  }
  return [...seen.entries()].sort(([a], [b]) => a - b).map(([unit, label]) => ({ unit, label }));
}

export function generateCustomPaper(count: number, subjects: Subject[], unit?: number, pastOnly?: boolean): { questions: Question[]; config: TestConfig } {
  const requested = Math.max(5, Math.min(30, Math.round(count)));
  const subjectFilter = subjects.length ? subjects : undefined;
  const pool = (questionsData as Question[]).filter((q) => {
    if (!isInSyllabus(q)) return false;
    if (pastOnly && q.origin !== "past-paper") return false;
    const matchesSubject = !subjectFilter || subjectFilter.includes(q.subject);
    // Past papers carry no unit tags, so topic filtering only applies to textbook questions
    const matchesTopic = pastOnly || unit === undefined || (subjectFilter && q.unit === unit);
    return matchesSubject && matchesTopic;
  });

  // ---- Balanced selection across all boards ----
  // Group the pool by board so every board that has questions is fairly represented,
  // instead of big banks (e.g. UHS, KMU) crowding out smaller ones in a plain shuffle.
  const byBoard = new Map<string, Question[]>();
  for (const q of pool) {
    const board = (q.source || "?").split(" ")[0];
    if (!byBoard.has(board)) byBoard.set(board, []);
    byBoard.get(board)!.push(q);
  }

  const boardNames = [...byBoard.keys()];
  const target = Math.min(requested, pool.length);
  const selected: Question[] = [];

  if (boardNames.length === 0) {
    // No questions at all
  } else if (target === pool.length) {
    // Requesting everything available — take it all
    selected.push(...shuffle(pool));
  } else {
    // Base share: divide the target evenly across boards
    let remaining = target;
    const perBoard = Math.floor(target / boardNames.length);

    // Round 1: each board contributes its base share (shuffled within board)
    for (const board of boardNames) {
      const shuffled = shuffle(byBoard.get(board)!);
      const take = Math.min(perBoard, shuffled.length, remaining);
      selected.push(...shuffled.slice(0, take));
      remaining -= take;
    }

    // Round 2: fill any leftover by taking more from boards that still have questions
    let guard = 0;
    while (remaining > 0 && guard++ < 50) {
      let added = false;
      for (const board of boardNames) {
        if (remaining <= 0) break;
        const shuffled = shuffle(byBoard.get(board)!);
        const used = new Set(selected.map((q) => q.id));
        const fresh = shuffled.filter((q) => !used.has(q.id));
        if (fresh.length > 0) {
          selected.push(fresh[0]);
          remaining--;
          added = true;
        }
      }
      if (!added) break; // no more fresh questions anywhere
    }
  }

  const questions = shuffle(selected);
  const bySubject = new Map<Subject, number>();
  for (const q of questions) bySubject.set(q.subject, (bySubject.get(q.subject) || 0) + 1);
  return {
    questions,
    config: {
      label: "My Custom Paper",
      totalMcqs: questions.length,
      subjects: [...bySubject.entries()].map(([subject, subjectCount]) => ({ subject, count: subjectCount })),
    },
  };
}

export function generateCustomTest(mode: string, subjects: Subject[]): { questions: Question[]; config: TestConfig } {
  const config = MODES[mode] || MODES.full;
  const selected: Question[] = [];

  // Free diagnostic + 2025 exam pull only real 2025 past papers
  const poolFor = mode === "free" || mode === "2025" ? get2025Questions : getSubjectQuestions;

  // Determine which subjects to include
  const activeSubjects = subjects.length > 0
    ? config.subjects.filter((s) => subjects.includes(s.subject))
    : config.subjects;

  // If subjects filtered, redistribute counts proportionally
  const totalFiltered = activeSubjects.reduce((sum, s) => sum + s.count, 0);
  const scale = totalFiltered > 0 ? config.totalMcqs / totalFiltered : 1;

  for (const { subject, count } of activeSubjects) {
    const adjustedCount = Math.min(
      Math.round(count * scale),
      poolFor(subject).length
    );
    const pool = shuffle(poolFor(subject));
    selected.push(...pool.slice(0, Math.max(1, adjustedCount)));
  }

  // Pad if we have fewer subjects than usual (e.g. quick practice single subject)
  // to hit the target total
  if (selected.length < config.totalMcqs) {
    for (const { subject } of activeSubjects) {
      const pool = shuffle(poolFor(subject));
      const existing = new Set(selected.map((q) => q.id));
      const remaining = pool.filter((q) => !existing.has(q.id));
      const needed = config.totalMcqs - selected.length;
      if (needed <= 0) break;
      selected.push(...remaining.slice(0, needed));
    }
  }

  return { questions: shuffle(selected), config };
}

export function calculateScore(
  questions: Question[],
  answers: Record<number, string | null>
) {
  let total = 0;
  const subjectScores: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    if (!subjectScores[q.subject]) {
      subjectScores[q.subject] = { correct: 0, total: 0 };
    }
    subjectScores[q.subject].total++;
    if (answers[q.id] === q.answer) {
      subjectScores[q.subject].correct++;
      total++;
    }
  }

  return { total, outOf: questions.length, subjectScores };
}

export { MODES };
