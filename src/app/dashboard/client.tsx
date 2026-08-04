"use client";

/* These effects hydrate client-only localStorage state after server rendering. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllTests, isFreeTestUsed, isDailyChallengeUsedToday, getCustomPapersUsedToday, isFullPreviewUsed, type StoredTest } from "@/lib/store";
import { getQuestionUnits, PAST_PAPERS_ONLY, type Subject } from "@/lib/questions";
import questionsData from "@/data/questions.json";
import AppHeader from "@/components/AppHeader";
import { useUser } from "@clerk/nextjs";

const ALL_SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"];

export default function DashboardClient() {
  const { user } = useUser();
  const [tests, setTests] = useState<StoredTest[]>([]);
  const [freeUsed, setFreeUsed] = useState(false);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [fullPreviewUsed, setFullPreviewUsed] = useState(false);

  // Test config state
  const [selectedMode, setSelectedMode] = useState("full");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [customSubject, setCustomSubject] = useState<Subject | "">("Biology");
  const [customCount, setCustomCount] = useState(30);
  const [customUnit, setCustomUnit] = useState("all");
  const [customPastOnly, setCustomPastOnly] = useState(false);
  const [customUsed, setCustomUsed] = useState(0);
  const demoParam = useSearchParams().get("demo");
  const isDemo = demoParam === "true" || demoParam === "1";

  useEffect(() => {
    setTests(getAllTests().filter((t) => t.submitted));
    setFreeUsed(isFreeTestUsed());
    setDailyAvailable(!isFreeTestUsed() || !isDailyChallengeUsedToday());
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

  const customUnits = customSubject ? getQuestionUnits(customSubject) : [];
  const customUnitLabel =
    customUnit !== "all" && customSubject
      ? customUnits.find((u) => u.unit === Number(customUnit))?.label ?? null
      : null;
  const previewSubject = customSubject || "All subjects";
  const previewTopic = PAST_PAPERS_ONLY || customPastOnly ? "Real past-paper MCQs" : customUnitLabel || "All topics";
  const customUrl = `/test?mode=custom&count=${customCount}${customSubject ? `&subjects=${encodeURIComponent(customSubject)}` : ""}${customUnit !== "all" && !customPastOnly && !PAST_PAPERS_ONLY ? `&unit=${customUnit}` : ""}${customPastOnly || PAST_PAPERS_ONLY ? "&past=1" : ""}${isDemo ? "&demo=1" : ""}`;
  const customPaperCard = (
    <section id="custom-paper" className="mt-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-stone-900">🎯 Build Your Own Paper</h2>
        <p className="mt-1 text-sm text-stone-600">Pick a subject and size — built from real MDCAT past-paper MCQs.</p>
      </div>
      <div className={`mt-4 grid gap-3 ${PAST_PAPERS_ONLY ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
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
        {!PAST_PAPERS_ONLY && (
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
        )}
      </div>

      {/* Past-paper only toggle — hidden while the bank is past-paper only by default */}
      {!PAST_PAPERS_ONLY && (
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-purple-200 bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={customPastOnly}
            onChange={(e) => setCustomPastOnly(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-purple-700"
          />
          <span>
            <span className="block text-sm font-semibold text-stone-900">Only real MDCAT past-paper MCQs</span>
            <span className="block text-xs text-stone-500">Build from actual past papers only — no textbook questions.</span>
          </span>
        </label>
      )}

      {/* Live preview */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-200 bg-purple-600/5 px-4 py-2.5">
        <p className="text-sm font-medium text-purple-800">
          You&apos;ll get: <span className="font-bold">{customCount} MCQs</span> &middot; {previewSubject} &middot; {previewTopic}
        </p>
        <p className="text-xs text-stone-500">~{customCount} min</p>
      </div>

      {/* CTA */}
      {customUsed >= 5 ? (
        <p className="mt-4 rounded-lg bg-white p-3 text-center text-sm font-semibold text-purple-700">You have used today&apos;s 5 papers. Come back tomorrow.</p>
      ) : (
        <Link href={customUrl} className="group mt-4 block rounded-xl bg-purple-700 p-4 text-center font-bold text-white shadow-md transition hover:bg-purple-600">
          Build My Paper <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      )}

      {/* Footer: limit + trust */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {Math.max(0, 5 - customUsed)} papers left today
        </p>
        <p className="text-xs text-stone-400">Built from real MDCAT past-paper questions</p>
      </div>
    </section>
  );

  // Diagnostic = the actual 30-MCQ free test (mode "free"), not any recent test
  const diagnostic = tests.find((t) => t.submitted && t.mode === "free") || null;

  // Compute correct count + per-subject for any stored test
  const testScore = (test: StoredTest) => {
    const allQ = questionsData as { id: number; subject: string; answer: string }[];
    const qMap = new Map(allQ.map((q) => [q.id, q]));
    let correct = 0;
    const perSubject: Record<string, { correct: number; total: number }> = {};
    for (const qid of test.questions) {
      const q = qMap.get(qid);
      if (!q) continue;
      if (!perSubject[q.subject]) perSubject[q.subject] = { correct: 0, total: 0 };
      perSubject[q.subject].total++;
      if (test.answers[qid] === q.answer) {
        perSubject[q.subject].correct++;
        correct++;
      }
    }
    const total = test.questions.length;
    let weakest: { subject: string; correct: number; total: number } | null = null;
    for (const [subject, s] of Object.entries(perSubject)) {
      if (s.total === 0) continue;
      if (!weakest || s.correct / s.total < weakest.correct / weakest.total) {
        weakest = { subject, ...s };
      }
    }
    return { correct, total, perSubject, weakest };
  };

  const diagnosticScore = diagnostic ? testScore(diagnostic) : null;

  // ===== "What should I do next?" — the single best next action =====
  const nextTask = (() => {
    if (!freeUsed) {
      return {
        stage: "Stage 1",
        stageLabel: "Diagnose",
        title: "Start Your Free Diagnostic",
        desc: "30 MCQs from the real 2025 papers · 30 minutes · Find your weak spots",
        href: "/test?mode=free",
        chip: "bg-teal-100 text-teal-800",
        bar: "bg-teal-600",
      };
    }
    // Diagnostic done — priority: weak subject → daily challenge → full exam
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
        desc: "180 MCQs from real UHS, KMU, SIBA, SZABMU & BUMHS 2025 papers",
        href: "/test?mode=2025",
        chip: "bg-amber-100 text-amber-800",
        bar: "bg-amber-500",
      };
    }
    return {
      stage: "Stage 2",
      stageLabel: "Practice",
      title: "Build a Custom Paper",
      desc: "Drill any subject you need with real past-paper questions",
      href: "/dashboard#custom-paper",
      chip: "bg-blue-100 text-blue-800",
      bar: "bg-blue-600",
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

  // ===== Unified dashboard — every user gets the same free experience =====
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

        {/* Stage header */}
        <div className="mt-6 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${freeUsed ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}>
            {freeUsed ? "Stage 3 · Practice & Mock Exams" : "Stage 1 · Diagnose"}
          </span>
          <span className="text-xs text-stone-400">
            {freeUsed ? "Simulate the real MDCAT with past-paper exams" : "Find your weak subjects first"}
          </span>
        </div>

        {/* Diagnostic score + weak-subject insight (when done) */}
        {freeUsed && diagnosticScore && (
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${diagnosticScore.correct / Math.max(1, diagnosticScore.total) >= 0.55 ? "bg-teal-100" : "bg-amber-100"}`}>
                <span className="text-xl font-bold text-stone-900">{diagnosticScore.correct}</span>
              </div>
              <div>
                <p className="text-sm text-stone-500">out of {diagnosticScore.total} questions</p>
                <h2 className="text-lg font-bold text-stone-900">
                  {diagnosticScore.correct / Math.max(1, diagnosticScore.total) >= 0.55 ? "Nice work!" : "Good start — keep practicing"}
                </h2>
              </div>
            </div>
            {diagnosticScore.weakest && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <strong>Focus tip:</strong> {diagnosticScore.weakest.subject} looks like your weakest area right now
                ({diagnosticScore.weakest.correct}/{diagnosticScore.weakest.total} correct).
              </p>
            )}
            {diagnostic && (
              <Link href={`/result/${diagnostic.id}`} className="mt-3 inline-block text-sm font-semibold text-teal-700 underline">
                View my full result
              </Link>
            )}
          </div>
        )}

        {/* The single next best action */}
        {nextTaskCard}

        {/* Daily free challenge — only show if Next Task isn't already pointing to it */}
        {freeUsed && nextTask.href !== "/test?mode=daily" && (
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

        {/* Mode selector — available to everyone */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Mock Exams</span>
            <span className="text-xs text-stone-400">Real past-paper questions · free</span>
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
          <h2 className="mb-3 text-sm font-semibold text-stone-600">
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
              {selectedSubjects.length > 0 ? selectedSubjects.join(", ") : "All Subjects"}
              {" | "}Real Past Paper Questions
            </p>
          </Link>
        </div>

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
                        <p className="text-sm text-stone-500">{Object.values(test.answers).filter(Boolean).length} / {test.questions.length} answered · Score: {testScore(test).correct}</p>
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
