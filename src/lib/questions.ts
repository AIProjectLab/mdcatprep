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

export function getTextbookQuestions(subject?: Subject, source?: string): Question[] {
  return (questionsData as Question[]).filter((q) => {
    const isTextbook = q.origin === "textbook";
    const matchesSubject = !subject || q.subject === subject;
    const matchesSource = !source || q.source === source;
    return isTextbook && matchesSubject && matchesSource;
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
  return (questionsData as Question[]).filter((q) => q.subject === subject);
}

export function getQuestionUnits(subject?: Subject): { unit: number; label: string }[] {
  const seen = new Map<number, string>();
  for (const q of questionsData as Question[]) {
    if (subject && q.subject !== subject || !Number.isInteger(q.unit)) continue;
    if (!seen.has(q.unit!)) seen.set(q.unit!, q.unitLabel || `Unit ${q.unit}`);
  }
  return [...seen.entries()].sort(([a], [b]) => a - b).map(([unit, label]) => ({ unit, label }));
}

export function generateCustomPaper(count: number, subjects: Subject[], unit?: number): { questions: Question[]; config: TestConfig } {
  const requested = Math.max(5, Math.min(30, Math.round(count)));
  const subjectFilter = subjects.length ? subjects : undefined;
  const pool = (questionsData as Question[]).filter((q) => {
    const matchesSubject = !subjectFilter || subjectFilter.includes(q.subject);
    const matchesTopic = unit === undefined || (subjectFilter && q.unit === unit);
    return matchesSubject && matchesTopic;
  });
  const questions = shuffle(pool).slice(0, Math.min(requested, pool.length));
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
      getSubjectQuestions(subject).length
    );
    const pool = shuffle(getSubjectQuestions(subject));
    selected.push(...pool.slice(0, Math.max(1, adjustedCount)));
  }

  // Pad if we have fewer subjects than usual (e.g. quick practice single subject)
  // to hit the target total
  if (selected.length < config.totalMcqs) {
    for (const { subject } of activeSubjects) {
      const pool = shuffle(getSubjectQuestions(subject));
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
