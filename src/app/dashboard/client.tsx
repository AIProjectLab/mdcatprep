"use client";

/* These effects hydrate client-only localStorage state after server rendering. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllTests, isFreeTestUsed, isDailyChallengeUsedToday, getCustomPapersUsedToday, isFullPreviewUsed, type StoredTest } from "@/lib/store";
import { getQuestionUnits, getTextbookQuestions, getTextbookSources, type Subject } from "@/lib/questions";
import questionsData from "@/data/questions.json";
import AppHeader from "@/components/AppHeader";
import { useUser } from "@clerk/nextjs";

const ALL_SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"];

export default function DashboardClient({
  hasAccess,
  paymentPending,
}: {
  hasAccess: boolean;
  paymentPending: boolean;
}) {
  const { user } = useUser();
  const [tests, setTests] = useState<StoredTest[]>([]);
  const [freeUsed, setFreeUsed] = useState(false);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [fullPreviewUsed, setFullPreviewUsed] = useState(false);

  // Test config state for Pro users
  const [selectedMode, setSelectedMode] = useState("full");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [textbookSubjects, setTextbookSubjects] = useState<Subject[]>([]);
  const [textbookCount, setTextbookCount] = useState(30);
  const [textbookSources, setTextbookSources] = useState<string[]>([]);
  const [selectedTextbookSource, setSelectedTextbookSource] = useState("All books");
  const [customSubject, setCustomSubject] = useState<Subject | "">("Biology");
  const [customCount, setCustomCount] = useState(30);
  const [customUnit, setCustomUnit] = useState("all");
  const [customUsed, setCustomUsed] = useState(0);
  const demoParam = useSearchParams().get("demo");
  const isDemo = demoParam === "true" || demoParam === "1";

  useEffect(() => {
    setTests(getAllTests().filter((t) => t.submitted));
    setFreeUsed(isFreeTestUsed());
    setDailyAvailable(!isFreeTestUsed() || !isDailyChallengeUsedToday());
    setTextbookSources(getTextbookSources());
    setCustomUsed(getCustomPapersUsedToday());
    setFullPreviewUsed(isFullPreviewUsed());
  }, []);

  const modes = [
    { id: "2025", label: "2025 Past Paper Exam", desc: "180 MCQs | Real 2025 papers", icon: "📋" },
    { id: "full", label: "Full Test", desc: "180 MCQs | 3 hrs", icon: "🎯" },
    { id: "half", label: "Half Test", desc: "90 MCQs | 90 min", icon: "⚡" },
    { id: "quick", label: "Quick Practice", desc: "30 MCQs | 30 min", icon: "📚" },
  ];

  function toggleSubject(s: Subject) {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function getTestUrl() {
    const subs = selectedSubjects.length > 0 ? `&subjects=${selectedSubjects.join(",")}` : "";
    return `/test?mode=${selectedMode}${subs}`;
  }

  function getTextbookUrl() {
    const subjects = textbookSubjects.length ? `&subjects=${textbookSubjects.join(",")}` : "";
    const source = selectedTextbookSource !== "All books" ? `&sources=${encodeURIComponent(selectedTextbookSource)}` : "";
    const effective = Math.min(textbookCount, textbookAvailable);
    return `/test?mode=textbook&count=${effective}${subjects}${source}`;
  }

  // Real number of questions available for the current textbook filter
  const textbookAvailable = (() => {
    let pool = getTextbookQuestions();
    if (selectedTextbookSource !== "All books") {
      pool = pool.filter((q) => q.source === selectedTextbookSource);
    }
    if (textbookSubjects.length > 0) {
      pool = pool.filter((q) => textbookSubjects.includes(q.subject));
    }
    return pool.length;
  })();
  const textbookEffectiveCount = Math.min(textbookCount, textbookAvailable);

  const customUnits = customSubject ? getQuestionUnits(customSubject) : [];
  const customUnitLabel =
    customUnit !== "all" && customSubject
      ? customUnits.find((u) => u.unit === Number(customUnit))?.label ?? null
      : null;
  const previewSubject = customSubject || "All subjects";
  const previewTopic = customUnitLabel || "All topics";
  const customUrl = `/test?mode=custom&count=${customCount}${customSubject ? `&subjects=${encodeURIComponent(customSubject)}` : ""}${customUnit !== "all" ? `&unit=${customUnit}` : ""}${isDemo ? "&demo=1" : ""}`;
  const customPaperCard = (
    <section id="custom-paper" className="mt-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-stone-900">🎯 Build Your Own Paper</h2>
        <p className="mt-1 text-sm text-stone-600">Drill exactly what you&apos;re weak in — pick a subject, topic and size.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-stone-700">Subject
          <select value={customSubject} onChange={(e) => { setCustomSubject(e.target.value as Subject | ""); setCustomUnit("all"); }} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-normal focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
            <option value="">All subjects</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-stone-700">Questions
          <select value={customCount} onChange={(e) => setCustomCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-normal focus:border-purple-500 focus:ring-1 focus:ring-purple-500">
            {[10, 20, 30].map((count) => <option key={count} value={count}>{count} MCQs</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-stone-700">Topic
          <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} disabled={!customSubject} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-normal focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-stone-50 disabled:text-stone-400">
            {!customSubject ? (
              <option value="all" disabled>Select a subject first</option>
            ) : (
              <>
                <option value="all">All topics</option>
                {customUnits.map(({ unit, label }) => <option key={unit} value={unit}>{label}</option>)}
              </>
            )}
          </select>
        </label>
      </div>

      {/* Live preview */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-200 bg-purple-600/5 px-4 py-2.5">
        <p className="text-sm font-medium text-purple-800">
          You&apos;ll get: <span className="font-bold">{customCount} MCQs</span> &middot; {previewSubject} &middot; {previewTopic}
        </p>
        <p className="text-xs text-stone-500">~{customCount} min</p>
      </div>

      {/* CTA */}
      {!hasAccess && customUsed >= 5 ? (
        <p className="mt-4 rounded-lg bg-white p-3 text-center text-sm font-semibold text-purple-700">You have used today&apos;s 5 free papers. Come back tomorrow.</p>
      ) : (
        <Link href={customUrl} className="group mt-4 block rounded-xl bg-purple-700 p-4 text-center font-bold text-white shadow-md transition hover:bg-purple-600">
          Build My Paper <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      )}

      {/* Footer: limit + trust */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {!hasAccess ? (
          <p className="text-xs text-stone-500">
            {Math.max(0, 5 - customUsed)} free papers left today
          </p>
        ) : (
          <p className="text-xs text-stone-400">Unlimited builds included</p>
        )}
        <p className="text-xs text-stone-400">{questionsData.length.toLocaleString()}+ questions from real past papers &amp; textbooks</p>
      </div>
    </section>
  );

  // Diagnostic = the actual 30-MCQ free test (mode "free"), not any recent test
  const diagnostic = tests.find((t) => t.submitted && t.mode === "free") || null;
  const diagnosticScore = (() => {
    if (!diagnostic) return null;
    const allQ = questionsData as { id: number; subject: string; answer: string }[];
    const qMap = new Map(allQ.map((q) => [q.id, q]));
    let correct = 0;
    const perSubject: Record<string, { correct: number; total: number }> = {};
    for (const qid of diagnostic.questions) {
      const q = qMap.get(qid);
      if (!q) continue;
      if (!perSubject[q.subject]) perSubject[q.subject] = { correct: 0, total: 0 };
      perSubject[q.subject].total++;
      if (diagnostic.answers[qid] === q.answer) {
        perSubject[q.subject].correct++;
        correct++;
      }
    }
    const total = diagnostic.questions.length;
    // Weakest subject = lowest percentage, only among subjects with at least 1 question
    let weakest: { subject: string; correct: number; total: number } | null = null;
    for (const [subject, s] of Object.entries(perSubject)) {
      if (s.total === 0) continue;
      if (!weakest || s.correct / s.total < weakest.correct / weakest.total) {
        weakest = { subject, ...s };
      }
    }
    return { correct, total, perSubject, weakest };
  })();

  // ===== "What should I do next?" — the single best next action =====
  const nextTask = (() => {
    if (!hasAccess) {
      if (!freeUsed) {
        return {
          stage: "Stage 1",
          stageLabel: "Diagnose",
          title: "Start Your Free Diagnostic",
          desc: "30 MCQs · 30 minutes · Find your weak spots",
          href: "/test?mode=free",
          chip: "bg-teal-100 text-teal-800",
          bar: "bg-teal-600",
        };
      }
      // Diagnostic done, free user
      // Priority: weak subject (most valuable) → daily challenge → full exam
      if (diagnosticScore?.weakest) {
        return {
          stage: "Stage 2",
          stageLabel: "Practice",
          title: `Practice ${diagnosticScore.weakest.subject}`,
          desc: `Build a custom paper on ${diagnosticScore.weakest.subject} — your weakest area`,
          href: `/test?mode=custom&count=15&subjects=${encodeURIComponent(diagnosticScore.weakest.subject)}`,
          chip: "bg-blue-100 text-blue-800",
          bar: "bg-blue-600",
        };
      }
      if (dailyAvailable) {
        return {
          stage: "Stage 2",
          stageLabel: "Practice",
          title: "Continue Today's Daily Challenge",
          desc: "30 MCQs · ~30 minutes · Fresh questions daily",
          href: "/test?mode=daily",
          chip: "bg-blue-100 text-blue-800",
          bar: "bg-blue-600",
        };
      }
      if (!fullPreviewUsed) {
        return {
          stage: "Stage 3",
          stageLabel: "Mock Exams",
          title: "Try the 2025 Past Paper Exam",
          desc: "180 MCQs from real UHS, KMU, SIBA, SZABMU & BUMHS 2025 papers · Free once",
          href: "/test?mode=2025",
          chip: "bg-amber-100 text-amber-800",
          bar: "bg-amber-500",
        };
      }
      return {
        stage: "Stage 2",
        stageLabel: "Practice",
        title: "Build a Custom Paper",
        desc: "Drill any subject and topic you need",
        href: "/dashboard#custom-paper",
        chip: "bg-blue-100 text-blue-800",
        bar: "bg-blue-600",
      };
    }
    // Pro user
    if (dailyAvailable) {
      return {
        stage: "Stage 2",
        stageLabel: "Practice",
        title: "Continue Today's Daily Challenge",
        desc: "30 MCQs · ~30 minutes · Fresh questions daily",
        href: "/test?mode=daily",
        chip: "bg-blue-100 text-blue-800",
        bar: "bg-blue-600",
      };
    }
    return {
      stage: "Stage 3",
      stageLabel: "Mock Exams",
      title: "Take a Mock Exam",
      desc: "Full (180), Half (90), or Quick (30) — real past paper questions",
      href: "/test?mode=full",
      chip: "bg-amber-100 text-amber-800",
      bar: "bg-amber-500",
    };
  })();

  const nextTaskCard = (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">🎯 Your Next Task</p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${nextTask.chip}`}>
          {nextTask.stage} · {nextTask.stageLabel}
        </span>
      </div>
      <div className="mt-3">
        <div className={`h-1 w-12 rounded-full ${nextTask.bar}`} />
        <h2 className="mt-2 text-xl font-bold text-stone-900">{nextTask.title}</h2>
        <p className="mt-1 text-sm text-stone-500">{nextTask.desc}</p>
      </div>
      <Link
        href={nextTask.href}
        className="mt-4 block rounded-xl bg-teal-700 p-4 text-center text-sm font-semibold text-white shadow-md transition hover:bg-teal-600"
      >
        Start Now
      </Link>
    </section>
  );

  // Free user who hasn't used their free test yet
  if (!hasAccess && !paymentPending && !freeUsed) {
    return (
      <main className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm text-stone-500">Welcome, {user?.firstName || "Student"}</p>

        {isDemo && (
          <Link href="#custom-paper" className="mt-4 block w-full rounded-xl border-2 border-dashed border-teal-400 bg-teal-50 p-3 text-center text-sm font-bold text-teal-700 hover:bg-teal-100 transition">
            🎬 Demo Mode ON — use &quot;Create Your Own Paper&quot; below to build &amp; record a test
          </Link>
        )}

        <div className="mt-6 flex items-center gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">Stage 1 · Diagnose</span>
          <span className="text-xs text-stone-400">Find your weak subjects first</span>
        </div>
        {nextTaskCard}
        <p className="mt-4 text-center text-sm text-stone-500">
          Finish the diagnostic to see your score and which subject to focus on.
        </p>

        {customPaperCard}

        {tests.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Previous Tests</h2>
            <div className="mt-4 space-y-3">
              {tests.map((test) => {
                const date = new Date(test.startTime).toLocaleDateString("en-PK", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <Link key={test.id} href={`/result/${test.id}`}
                    className="block rounded-xl border bg-white p-4 shadow-sm hover:border-teal-300 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-900">{date}</p>
                        <p className="text-sm text-stone-500">{Object.values(test.answers).filter(Boolean).length} / {test.questions.length} answered</p>
                      </div>
                      <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </main>
    );
  }

  // Free user who already used their free test, or payment pending
  if (!hasAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <AppHeader />
        <div className="fixed right-4 top-4 flex items-center gap-3">
          {isDemo && <a href="#custom-paper" className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600">🎬 Demo</a>}
        </div>
        <div className="max-w-md">
          {freeUsed ? (
            <>
              {/* Score first — the reward moment */}
              {diagnosticScore ? (
                <div className="text-center">
                  <div className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full ${diagnosticScore.correct / Math.max(1, diagnosticScore.total) >= 0.55 ? "bg-teal-100" : "bg-amber-100"}`}>
                    <span className="text-2xl font-bold text-stone-900">{diagnosticScore.correct}</span>
                  </div>
                  <p className="text-sm text-stone-500">out of {diagnosticScore.total} questions</p>
                  <h1 className="mt-2 text-xl font-bold text-stone-900">
                    {diagnosticScore.correct / Math.max(1, diagnosticScore.total) >= 0.55 ? "Nice work!" : "Good start — keep practicing"}
                  </h1>
                </div>
              ) : (
                <h1 className="text-2xl font-bold">Welcome back</h1>
              )}

              {/* Weak-subject insight — proof of value */}
              {diagnosticScore?.weakest && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                  <p className="text-sm text-amber-800">
                    <strong>Focus tip:</strong> {diagnosticScore.weakest.subject} looks like your weakest area right now
                    ({diagnosticScore.weakest.correct}/{diagnosticScore.weakest.total} correct).
                  </p>
                </div>
              )}

              {diagnostic && (
                <Link href={`/result/${diagnostic.id}`} className="mt-4 inline-block text-sm font-semibold text-teal-700 underline">
                  View my full result
                </Link>
              )}

              {/* The single next best action */}
              {nextTaskCard}

              {/* Daily free challenge — only show if Next Task isn't already pointing to it */}
              {nextTask.href !== "/test?mode=daily" && (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-left">
                  <h2 className="font-bold text-stone-900">Today&apos;s free challenge</h2>
                  <p className="mt-1 text-sm text-stone-600">30 fresh MDCAT-style questions. New one every day.</p>
                  {dailyAvailable ? (
                    <Link href="/test?mode=daily" className="mt-4 block rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
                      Start Today&apos;s Challenge
                    </Link>
                  ) : (
                    <p className="mt-4 text-center text-sm font-semibold text-blue-700">Today&apos;s challenge completed ✓</p>
                  )}
                </div>
              )}

              {customPaperCard}

              {/* Quiet upsell — last, small, not a card wall */}
              <p className="mt-6 text-center text-sm text-stone-500">
                Want full-length 180-MCQ exams and subject-focused tests?{" "}
                <Link href="/payment" className="font-semibold text-teal-700 underline">Unlock unlimited</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Access Required</h1>
              <p className="mt-4 text-stone-600">
                {paymentPending
                  ? "Your payment is being verified. You will get access within a few hours."
                  : "Purchase access to start practicing full-length MDCAT mock tests."}
              </p>
              {!paymentPending && (
                <Link href="/payment"
                  className="mt-6 inline-block rounded-lg bg-teal-700 px-8 py-3 text-sm font-semibold text-white hover:bg-teal-600">
                  Get access
                </Link>
              )}
            </>
          )}
        </div>
      </main>
    );
  }

  // Pro user
  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-stone-500">Welcome, {user?.firstName || "Student"}</p>

        {nextTaskCard}

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Stage 3 · Mock Exams</span>
            <span className="text-xs text-stone-400">Simulate the real MDCAT</span>
          </div>
          <h2 className="mt-3 text-sm font-semibold text-stone-600">Select Test Mode</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedMode === mode.id
                    ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <span className="text-xl">{mode.icon}</span>
                <p className="mt-1 font-semibold text-stone-900">{mode.label}</p>
                <p className="text-sm text-stone-500">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

      {/* Subject Filter (shown for all modes) */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-stone-600 mb-3">
          Subject Focus <span className="font-normal text-stone-400">(optional — leave empty for all subjects)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSubject(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                selectedSubjects.includes(s)
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-8">
        <Link
          href={getTestUrl()}
          className="block w-full rounded-xl bg-teal-700 p-6 text-center text-white shadow-lg hover:bg-teal-600 transition"
        >
          <p className="text-lg font-bold">Start {modes.find((m) => m.id === selectedMode)?.label}</p>
          <p className="mt-1 text-sm text-teal-100">
            {selectedSubjects.length > 0
              ? selectedSubjects.join(", ")
              : "All Subjects"}
            {" | "}Real Past Paper Questions
          </p>
        </Link>
      </div>

      {/* Textbook Practice */}
      <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">📚 Textbook Practice</h2>
            <p className="mt-1 text-sm text-stone-600">
              Practice new questions generated from the textbooks. This is separate from the real past-paper tests above.
            </p>
          </div>
          <span className="text-sm font-semibold text-blue-700">{getTextbookQuestions().length} questions available</span>
        </div>

        {textbookSources.length === 0 ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 text-sm text-stone-600">
            Textbook questions are not published yet. Generate questions from the local book generator, then sync them into the app.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-stone-700">
                Number of questions
                <select value={textbookCount} onChange={(e) => setTextbookCount(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-normal">
                  {[30, 50, 90, 180].filter((count) => count <= textbookAvailable).map((count) => <option key={count} value={count}>{count} MCQs</option>)}
                  {textbookCount > textbookAvailable && textbookAvailable > 0 && (
                    <option value={textbookAvailable}>{textbookAvailable} MCQs (max available)</option>
                  )}
                </select>
                <span className="mt-1 block text-xs font-normal text-blue-600">
                  {textbookAvailable > 0
                    ? `${textbookAvailable} available${textbookSubjects.length > 0 ? ` in ${textbookSubjects.join(", ")}` : ""}`
                    : "No questions for this selection"}
                </span>
              </label>
              <label className="text-sm font-semibold text-stone-700">
                Book/source
                <select value={selectedTextbookSource} onChange={(e) => setSelectedTextbookSource(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-normal">
                  <option>All books</option>
                  {textbookSources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ALL_SUBJECTS.slice(0, 3).map((s) => (
                <button key={`textbook-${s}`} onClick={() => setTextbookSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${textbookSubjects.includes(s)
                    ? "border-blue-500 bg-blue-100 text-blue-700" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"}`}>
                  {s}
                </button>
              ))}
              <span className="self-center text-xs text-stone-500">Leave subjects unselected for all subjects.</span>
            </div>
            {textbookAvailable > 0 ? (
              <Link href={getTextbookUrl()}
                className="mt-5 block rounded-xl bg-blue-600 p-4 text-center font-bold text-white shadow-sm hover:bg-blue-500 transition">
                Start {textbookEffectiveCount}-MCQ Textbook Practice
              </Link>
            ) : (
              <p className="mt-5 rounded-lg bg-white p-3 text-center text-sm font-semibold text-blue-700">
                No textbook questions match this selection. Try another subject or book.
              </p>
            )}
          </>
        )}
      </section>

      {tests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Previous Tests</h2>
          <div className="mt-4 space-y-3">
            {tests.map((test) => {
              const date = new Date(test.startTime).toLocaleDateString("en-PK", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              });
              return (
                <Link key={test.id} href={`/result/${test.id}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm hover:border-teal-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-900">{date}</p>
                      <p className="text-sm text-stone-500">{Object.values(test.answers).filter(Boolean).length} / {test.questions.length} answered</p>
                    </div>
                    <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
