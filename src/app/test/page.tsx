"use client";

/* These effects initialize client-only test state after authentication/localStorage load. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { generateCustomPaper, generateCustomTest, generateTextbookTest } from "@/lib/questions";
import type { Question, Subject } from "@/lib/questions";
import { saveTest, isFreeTestUsed, markFreeTestUsed, isDailyChallengeUsedToday, markDailyChallengeUsed, isCustomPaperLimitReached, markCustomPaperStarted } from "@/lib/store";
import Timer from "@/components/Timer";
import QuestionDisplay from "@/components/QuestionDisplay";
import QuestionPalette from "@/components/QuestionPalette";

function getConfig() {
  if (typeof window === "undefined") return { mode: "full", subjects: [] as Subject[], count: 0, sources: [] as string[] };
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "full";
  const subs = params.get("subjects") || "";
  const subjects = subs ? (subs.split(",") as Subject[]) : [];
  const count = Number(params.get("count") || 0);
  const sources = params.get("sources") ? params.get("sources")!.split(",") : [];
  const unitValue = params.get("unit");
  return { mode, subjects, count, sources, unit: unitValue ? Number(unitValue) : undefined };
}

interface TestData {
  questions: Question[];
  testId: string;
  startTime: number;
  duration: number;
  mode: string;
  modeId: string;
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
  const initialized = useRef(false);

  // Redirect free users who already used their free test
  useEffect(() => {
    if (!isLoaded) return;
    const isPro = user?.publicMetadata?.hasAccess === true;
    const { mode } = getConfig();
    if (!isPro && ((mode !== "daily" && mode !== "custom" && isFreeTestUsed()) || (mode === "daily" && isDailyChallengeUsedToday()) || (mode === "custom" && isCustomPaperLimitReached()))) {
      setRedirecting(true);
      router.replace("/dashboard");
    }
  }, [isLoaded, user, router]);

  // Generate test on mount
  useEffect(() => {
    if (redirecting || !isLoaded) return;
    if (initialized.current) return;
    initialized.current = true;
    const { mode, subjects, count, sources, unit } = getConfig();
    const result = mode === "textbook"
      ? generateTextbookTest(count || 30, subjects, sources)
      : mode === "custom"
      ? generateCustomPaper(count || 30, subjects, unit)
      : generateCustomTest(mode, subjects);
    const { questions, config } = result;
    if (mode === "custom" && questions.length === 0) {
      initialized.current = false;
      setTestReady(true);
      return;
    }
    if (mode === "custom" && !user?.publicMetadata?.hasAccess) markCustomPaperStarted();
    const id = "test_" + Date.now();
    const startTime = Date.now();
    const duration = mode === "textbook"
      ? Math.max(30, questions.length) * 60 * 1000
      : mode === "free" || mode === "quick" || mode === "custom"
      ? 30 * 60 * 1000
      : mode === "half" ? 90 * 60 * 1000 : 3 * 60 * 60 * 1000;

    saveTest({
      id, startTime, endTime: null, duration,
      questions: questions.map((q) => q.id), answers: {}, submitted: false,
    });

    setTestData({ questions, testId: id, startTime, duration, mode: config.label, modeId: mode });
    setTestReady(true);
  }, [redirecting, isLoaded]);

  const handleSelect = (option: string) => {
    if (submitted || !testData) return;
    const q = testData.questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
  };

  const finishTest = useCallback(() => {
    if (submitted || !testData) return;
    setSubmitted(true);
    const now = Date.now();
    const { questions, testId, startTime, duration } = testData;

    const isPro = user?.publicMetadata?.hasAccess === true;
    if (!isPro && testData.modeId === "daily") markDailyChallengeUsed();
    else if (!isPro && testData.modeId !== "custom") markFreeTestUsed();

    saveTest({
      id: testId, startTime, endTime: now, duration,
      questions: questions.map((q) => q.id), answers, submitted: true,
    });

    router.push("/result/" + testId);
  }, [submitted, testData, answers, router, user]);

  if (redirecting || !testReady || !testData) return null;

  if (testData.questions.length === 0) {
    return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">No textbook questions available yet</h1>
        <p className="mt-3 text-gray-600">Generate and sync textbook questions first, then come back to start practice.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white">Back to dashboard</button>
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
            <span className="text-sm font-semibold text-gray-900">MDCAT Pro</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{testData.mode}</span>
          </div>
          <Timer endTime={endTime} onTimeUp={finishTest} />
          <div className="text-sm text-gray-600">{answeredCount}/{questions.length}</div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <QuestionDisplay question={currentQ} selected={answers[currentQ?.id] ?? null} onSelect={handleSelect} />

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition">
              ← Previous
            </button>
            <span className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</span>
            {currentIndex === questions.length - 1 ? (
              <button onClick={() => setShowConfirmSubmit(true)} disabled={submitted}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                Finish Test &amp; See Results
              </button>
            ) : (
              <button onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
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
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30">Previous</button>
          <span className="text-sm text-gray-500">{currentIndex + 1}/{questions.length}</span>
          {currentIndex === questions.length - 1 ? (
            <button onClick={() => setShowConfirmSubmit(true)} disabled={submitted}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Finish</button>
          ) : (
            <button onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              className="rounded-lg border px-4 py-2 text-sm">Next</button>
          )}
        </div>
      </footer>

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Submit Test?</h2>
            <p className="mt-2 text-sm text-gray-600">
              You answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && <span> {questions.length - answeredCount} unanswered.</span>}
            </p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Go Back</button>
              <button onClick={finishTest}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
