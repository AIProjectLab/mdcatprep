export interface StoredTest {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number; // 3 hours in ms
  questions: number[]; // question IDs
  answers: Record<number, string | null>;
  submitted: boolean;
}

export function saveTest(test: StoredTest) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem("mdcat_tests") || "{}");
  existing[test.id] = test;
  localStorage.setItem("mdcat_tests", JSON.stringify(existing));
}

export function getTest(id: string): StoredTest | null {
  if (typeof window === "undefined") return null;
  const existing = JSON.parse(localStorage.getItem("mdcat_tests") || "{}");
  return existing[id] || null;
}

export function getAllTests(): StoredTest[] {
  if (typeof window === "undefined") return [];
  const existing = JSON.parse(localStorage.getItem("mdcat_tests") || "{}");
  const values = Object.values(existing) as StoredTest[];
  return values.sort((a, b) => b.startTime - a.startTime);
}

const FREE_TEST_KEY = "mdcat_free_test_used";
const DAILY_CHALLENGE_KEY = "mdcat_daily_challenge_date";
const CUSTOM_PAPER_KEY = "mdcat_custom_papers_started";

export function isFreeTestUsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FREE_TEST_KEY) === "true";
}

export function markFreeTestUsed() {
  if (typeof window === "undefined") return;
  localStorage.setItem(FREE_TEST_KEY, "true");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isDailyChallengeUsedToday(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DAILY_CHALLENGE_KEY) === todayKey();
}

export function markDailyChallengeUsed() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DAILY_CHALLENGE_KEY, todayKey());
}

export function getCustomPapersUsedToday(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(CUSTOM_PAPER_KEY);
  if (!raw) return 0;
  try {
    const value = JSON.parse(raw) as { date?: string; count?: number };
    return value.date === todayKey() ? Math.max(0, Number(value.count) || 0) : 0;
  } catch {
    return 0;
  }
}

export function isCustomPaperLimitReached(limit = 5): boolean {
  return getCustomPapersUsedToday() >= limit;
}

export function markCustomPaperStarted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_PAPER_KEY, JSON.stringify({ date: todayKey(), count: getCustomPapersUsedToday() + 1 }));
}
