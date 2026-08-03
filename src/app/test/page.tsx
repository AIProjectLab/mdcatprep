"use client";

/* These effects initialize client-only test state after authentication/localStorage load. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { generateCustomPaper, generateCustomTest, generateTextbookTest } from "@/lib/questions";
import type { Question, Subject } from "@/lib/questions";
import { saveTest, isFreeTestUsed, markFreeTestUsed, isDailyChallengeUsedToday, markDailyChallengeUsed, isCustomPaperLimitReached, markCustomPaperStarted, isFullPreviewUsed, markFullPreviewUsed } from "@/lib/store";
import Timer from "@/components/Timer";
import QuestionDisplay from "@/components/QuestionDisplay";
import QuestionPalette from "@/components/QuestionPalette";

function getConfig() {
  if (typeof window === "undefined") return { mode: "full", subjects: [] as Subject[], count: 0, sources: [] as string[], demo: false, pastOnly: false };
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "full";
  const subs = params.get("subjects") || "";
  const subjects = subs ? (subs.split(",") as Subject[]) : [];
  const count = Number(params.get("count") || 0);
  const sources = params.get("sources") ? params.get("sources")!.split(",") : [];
  const unitValue = params.get("unit");
  const demoVal = params.get("demo");
  const demo = demoVal === "1" || demoVal === "true" || mode === "demo";
  const pastOnly = params.get("past") === "1";
  return { mode, subjects, count, sources, unit: unitValue ? Number(unitValue) : undefined, demo, pastOnly };
}

interface TestData {
  questions: Question[];
  testId: string;
  startTime: number;
  duration: number;
  mode: string;
  modeId: string;
  demo: boolean;
}

export default function TestPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [testReady, setTestReady] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [navTap, setNavTap] = useState<"next" | "prev" | null>(null);
  const [customEmpty, setCustomEmpty] = useState(false);
  const initialized = useRef(false);

  // Redirect free users who already used their free test
  useEffect(() => {
    if (!isLoaded) return;
    const isPro = user?.publicMetadata?.hasAccess === true;
    const { mode } = getConfig();
    let blocked = false;
    if (!isPro && mode !== "demo") {
      if (mode === "full" || mode === "2025") {
        // Free users get one full-length preview, then it's locked
        blocked = isFullPreviewUsed();
      } else if (mode !== "daily" && mode !== "custom" && isFreeTestUsed()) {
        blocked = true;
      } else if (mode === "daily" && isDailyChallengeUsedToday()) {
        blocked = true;
      } else if (mode === "custom" && isCustomPaperLimitReached()) {
        blocked = true;
      }
    }
    if (blocked) {
      setRedirecting(true);
      router.replace("/dashboard");
    }
  }, [isLoaded, user, router]);

  // Generate test on mount
  useEffect(() => {
    if (redirecting || !isLoaded) return;
    if (initialized.current) return;
    initialized.current = true;
    const { mode, subjects, count, sources, unit, demo, pastOnly } = getConfig();
    const result = mode === "textbook"
      ? generateTextbookTest(count || 30, subjects, sources)
      : mode === "custom"
      ? generateCustomPaper(count || 30, subjects, unit, pastOnly)
      : generateCustomTest(mode, subjects);
    const { questions, config } = result;
    if (mode === "custom" && questions.length === 0) {
      initialized.current = false;
      setCustomEmpty(true);
      setTestReady(true);
      return;
    }
    if (mode === "custom" && !user?.publicMetadata?.hasAccess) markCustomPaperStarted();
    const id = "test_" + Date.now();
    const startTime = Date.now();
    const duration = mode === "textbook"
      ? Math.max(30, questions.length) * 60 * 1000
      : mode === "free" || mode === "quick" || mode === "custom" || mode === "demo"
      ? 30 * 60 * 1000
      : mode === "half" ? 90 * 60 * 1000 : 3 * 60 * 60 * 1000;

    saveTest({
      id, mode, startTime, endTime: null, duration,
      questions: questions.map((q) => q.id), answers: {}, submitted: false,
    });

    setTestData({ questions, testId: id, startTime, duration, mode: config.label, modeId: mode, demo });
    setTestReady(true);
  }, [redirecting, isLoaded]);

  // Demo mode: auto-fill answer 2.5s after navigating to a question
  const demoFilled = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!testData || !testData.demo) return;
    const total = testData.questions.length;
    const q = testData.questions[currentIndex];
    if (!q || demoFilled.current.has(q.id) || currentIndex >= total - 2) return;
    const timer = setTimeout(() => {
      demoFilled.current.add(q.id);
      const isWrong = currentIndex === total - 2;
      const answer = isWrong
        ? (Object.keys(q.options) as string[]).find((k) => k !== q.answer) || "A"
        : q.answer;
      setAnswers((prev) => ({ ...prev, [q.id]: answer }));
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentIndex, testData]);

  const handleSelect = (option: string) => {
    if (submitted || !testData) return;
    const q = testData.questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
  };

  // Navigate with a brief tap animation on the button
  const navigateWithTap = (dir: "next" | "prev") => {
    if (submitted || !testData) return;
    setNavTap(dir);
    setTimeout(() => setNavTap(null), 350);
    setCurrentIndex((idx) =>
      dir === "next"
        ? Math.min(testData.questions.length - 1, idx + 1)
        : Math.max(0, idx - 1)
    );
  };

  const finishTest = useCallback(() => {
    if (submitted || !testData) return;
    setSubmitted(true);
    const now = Date.now();
    const { questions, testId, startTime, duration } = testData;

    const isPro = user?.publicMetadata?.hasAccess === true;
    if (!isPro && testData.modeId === "daily") markDailyChallengeUsed();
    else if (!isPro && (testData.modeId === "full" || testData.modeId === "2025")) markFullPreviewUsed();
    else if (!isPro && testData.modeId !== "custom") markFreeTestUsed();

    saveTest({
      id: testId, mode: testData.modeId, startTime, endTime: now, duration,
      questions: questions.map((q) => q.id), answers, submitted: true,
    });

    router.push("/result/" + testId);
  }, [submitted, testData, answers, router, user]);

  if (customEmpty) {
    return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">No matching questions found</h1>
        <p className="mt-3 text-stone-600">Try a different subject or pick a smaller question count, then come back to start practice.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white">Back to dashboard</button>
      </div>
    </main>;
  }

  if (redirecting || !testReady || !testData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" aria-label="Loading" />
        <p className="mt-4 text-sm text-stone-500">Preparing your test...</p>
      </main>
    );
  }

  if (testData.questions.length === 0) {
    return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">No textbook questions available yet</h1>
        <p className="mt-3 text-stone-600">Generate and sync textbook questions first, then come back to start practice.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white">Back to dashboard</button>
      </div>
    </main>;
  }

  const { questions, startTime, duration } = testData;
  const endTime = startTime + duration;
  const answeredCount = Object.values(answers).filter((a) => a != null).length;
  const currentQ = questions[currentIndex];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-900">MDCAT Prep</span>
            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{testData.mode}</span>
          </div>
          <Timer endTime={endTime} onTimeUp={finishTest} />
          <div className="text-sm text-stone-600">{answeredCount}/{questions.length}</div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-stone-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <QuestionDisplay question={currentQ} selected={answers[currentQ?.id] ?? null} onSelect={handleSelect} />

          <div className="mt-6 hidden lg:flex items-center justify-between">
            <button onClick={() => navigateWithTap("prev")}
              disabled={currentIndex === 0}
              className={`rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-30 transition ${navTap === "prev" ? "animate-tap" : ""}`}>
              ← Previous
            </button>
            <span className="text-sm text-stone-400">{currentIndex + 1} / {questions.length}</span>
            {currentIndex === questions.length - 1 ? (
              <button onClick={() => setShowConfirmSubmit(true)} disabled={submitted}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition">
                Finish Test &amp; See Results
              </button>
            ) : (
              <button onClick={() => navigateWithTap("next")}
                className={`rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition ${navTap === "next" ? "animate-tap" : ""}`}>
                Next →
              </button>
            )}
          </div>
        </main>

        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            <QuestionPalette questions={questions} answers={answers} currentIndex={currentIndex} onNavigate={setCurrentIndex} />
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 border-t bg-white p-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigateWithTap("prev")}
            disabled={currentIndex === 0}
            className={`min-h-12 flex-1 rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-30 ${navTap === "prev" ? "animate-tap" : ""}`}>Previous</button>
          <span className="text-sm text-stone-500">{currentIndex + 1}/{questions.length}</span>
          {currentIndex === questions.length - 1 ? (
            <button onClick={() => setShowConfirmSubmit(true)} disabled={submitted}
              className="min-h-12 flex-1 rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Finish</button>
          ) : (
            <button onClick={() => navigateWithTap("next")}
              className={`min-h-12 flex-1 rounded-lg border px-4 py-3 text-sm font-medium ${navTap === "next" ? "animate-tap" : ""}`}>Next</button>
          )}
        </div>
      </footer>

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Submit Test?</h2>
            <p className="mt-2 text-sm text-stone-600">
              You answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && <span> {questions.length - answeredCount} unanswered.</span>}
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-stone-50">Go Back</button>
              <button onClick={finishTest}
                className="flex-1 rounded-lg bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-600">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
