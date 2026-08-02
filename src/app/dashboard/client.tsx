"use client";

/* These effects hydrate client-only localStorage state after server rendering. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllTests, isFreeTestUsed, isDailyChallengeUsedToday, getCustomPapersUsedToday, type StoredTest } from "@/lib/store";
import { getQuestionUnits, getTextbookQuestions, getTextbookSources, type Subject } from "@/lib/questions";
import { UserButton, useUser } from "@clerk/nextjs";

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

  // Test config state for Pro users
  const [selectedMode, setSelectedMode] = useState("full");
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [textbookSubjects, setTextbookSubjects] = useState<Subject[]>([]);
  const [textbookCount, setTextbookCount] = useState(30);
  const [textbookSources, setTextbookSources] = useState<string[]>([]);
  const [selectedTextbookSource, setSelectedTextbookSource] = useState("All books");
  const [customSubject, setCustomSubject] = useState<Subject | "">("");
  const [customCount, setCustomCount] = useState(30);
  const [customUnit, setCustomUnit] = useState("all");
  const [customUsed, setCustomUsed] = useState(0);
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    setTests(getAllTests().filter((t) => t.submitted));
    setFreeUsed(isFreeTestUsed());
    setDailyAvailable(!isFreeTestUsed() || !isDailyChallengeUsedToday());
    setTextbookSources(getTextbookSources());
    setCustomUsed(getCustomPapersUsedToday());
  }, []);

  const modes = [
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
    return `/test?mode=textbook&count=${textbookCount}${subjects}${source}`;
  }

  const customUnits = customSubject ? getQuestionUnits(customSubject) : [];
  const customUrl = `/test?mode=custom&count=${customCount}${customSubject ? `&subjects=${encodeURIComponent(customSubject)}` : ""}${customUnit !== "all" ? `&unit=${customUnit}` : ""}`;
  const customPaperCard = (
    <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🛠️ Create Your Own Paper</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a subject and topic, then build a fresh practice paper.</p>
        </div>
        {!hasAccess && <span className="whitespace-nowrap text-sm font-semibold text-purple-700">{customUsed}/5 today</span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-gray-700">Subject
          <select value={customSubject} onChange={(e) => { setCustomSubject(e.target.value as Subject | ""); setCustomUnit("all"); }} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
            <option value="">All subjects</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-700">Questions
          <select value={customCount} onChange={(e) => setCustomCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
            {[10, 20, 30].map((count) => <option key={count} value={count}>{count} MCQs</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-700">Topic
          <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
            <option value="all">All topics</option>
            {!customSubject && <option value="all">Select a subject first</option>}
            {customUnits.map(({ unit, label }) => <option key={unit} value={unit}>{label}</option>)}
          </select>
        </label>
      </div>
      {!hasAccess && customUsed >= 5 ? (
        <p className="mt-4 rounded-lg bg-white p-3 text-center text-sm font-semibold text-purple-700">You have used today&apos;s 5 free papers. Come back tomorrow.</p>
      ) : (
        <Link href={customUrl} className="mt-4 block rounded-xl bg-purple-600 p-4 text-center font-bold text-white shadow-sm hover:bg-purple-500 transition">Build My Paper →</Link>
      )}
    </section>
  );

  // Free user who hasn't used their free test yet
  if (!hasAccess && !paymentPending && !freeUsed) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MDCAT Pro</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.firstName || "Student"}</p>
          </div>
          <UserButton />
        </header>

        <div className="mt-8">
          <Link href="/test?mode=free"
            className="block w-full rounded-xl bg-emerald-600 p-6 text-center text-white shadow-lg hover:bg-emerald-500 transition">
            <p className="text-lg font-bold">Start Your Free Test</p>
            <p className="mt-1 text-sm text-emerald-100">30 MCQs | 30 Minutes | 1 Free Diagnostic</p>
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Free diagnostic:</strong> Find your weakest subject first. Upgrade to Pro for unlimited full-length and focused practice tests.
          </p>
          <Link href="/payment" className="mt-2 inline-block text-sm font-semibold text-amber-700 underline hover:text-amber-600">
            See Pro benefits →
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
                    className="block rounded-xl border bg-white p-4 shadow-sm hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{date}</p>
                        <p className="text-sm text-gray-500">{Object.values(test.answers).filter(Boolean).length} / {test.questions.length} answered</p>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    );
  }

  // Free user who already used their free test, or payment pending
  if (!hasAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="fixed right-4 top-4 flex items-center gap-3">
          {isAdmin && <Link href="/admin" className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">Admin</Link>}
          <UserButton />
        </div>
        <div className="max-w-md">
          {freeUsed ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <span className="text-2xl">🎯</span>
              </div>
              <h1 className="text-2xl font-bold">Your diagnostic is complete 🎯</h1>
              <p className="mt-4 text-gray-600">
                Your score is saved. Review your result or continue with the complete MDCAT preparation package.
              </p>
              {tests[0] && (
                <Link href={`/result/${tests[0].id}`} className="mt-5 inline-block text-sm font-semibold text-emerald-700 underline">
                  Review My Diagnostic Result
                </Link>
              )}
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left">
                <h2 className="font-bold text-gray-900">MDCAT Pro — PKR 1,000 one-time</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>✓ Unlimited 180-MCQ full exam simulations</li>
                  <li>✓ 90-MCQ half tests and 30-MCQ quick practice</li>
                  <li>✓ Subject-focused tests for Biology, Chemistry, Physics, English, and LR</li>
                  <li>✓ Score history and subject-wise performance review</li>
                  <li>✓ Private WhatsApp preparation and doubt-solving group</li>
                </ul>
                <Link href="/payment" className="mt-5 block rounded-lg bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500">
                  Get Pro Access — PKR 1,000
                </Link>
              </div>
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-left">
                <h2 className="font-bold text-gray-900">Keep practicing free</h2>
                <p className="mt-1 text-sm text-gray-600">Try 30 fresh MDCAT-style questions each day. Come back tomorrow for a new challenge.</p>
                {dailyAvailable ? (
                  <Link href="/test?mode=daily" className="mt-4 block rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
                    Start Today&apos;s Challenge
                  </Link>
                ) : (
                  <p className="mt-4 text-center text-sm font-semibold text-blue-700">Today&apos;s challenge completed ✓</p>
                )}
              </div>
              {customPaperCard}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Access Required</h1>
              <p className="mt-4 text-gray-600">
                {paymentPending
                  ? "Your payment is being verified. You will get access within a few hours."
                  : "Purchase access to start practicing full-length MDCAT mock tests."}
              </p>
              {!paymentPending && (
                <Link href="/payment"
                  className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
                  Buy Pro Access — PKR 1,000
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MDCAT Pro</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.firstName || "Student"}</p>
        </div>
        <UserButton />
      </header>

      {/* Mode Selection */}
      {customPaperCard}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Select Test Mode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedMode === mode.id
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{mode.icon}</span>
              <p className="mt-1 font-semibold text-gray-900">{mode.label}</p>
              <p className="text-sm text-gray-500">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter (shown for all modes) */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          Subject Focus <span className="font-normal text-gray-400">(optional — leave empty for all subjects)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSubject(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                selectedSubjects.includes(s)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
          className="block w-full rounded-xl bg-emerald-600 p-6 text-center text-white shadow-lg hover:bg-emerald-500 transition"
        >
          <p className="text-lg font-bold">Start {modes.find((m) => m.id === selectedMode)?.label}</p>
          <p className="mt-1 text-sm text-emerald-100">
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
            <h2 className="text-lg font-bold text-gray-900">📚 Textbook Practice</h2>
            <p className="mt-1 text-sm text-gray-600">
              Practice new questions generated from the textbooks. This is separate from the real past-paper tests above.
            </p>
          </div>
          <span className="text-sm font-semibold text-blue-700">{getTextbookQuestions().length} questions available</span>
        </div>

        {textbookSources.length === 0 ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 text-sm text-gray-600">
            Textbook questions are not published yet. Generate questions from the local book generator, then sync them into the app.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">
                Number of questions
                <select value={textbookCount} onChange={(e) => setTextbookCount(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                  {[30, 50, 90, 180].map((count) => <option key={count} value={count}>{count} MCQs</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700">
                Book/source
                <select value={selectedTextbookSource} onChange={(e) => setSelectedTextbookSource(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                  <option>All books</option>
                  {textbookSources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ALL_SUBJECTS.slice(0, 3).map((s) => (
                <button key={`textbook-${s}`} onClick={() => setTextbookSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${textbookSubjects.includes(s)
                    ? "border-blue-500 bg-blue-100 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  {s}
                </button>
              ))}
              <span className="self-center text-xs text-gray-500">Leave subjects unselected for all subjects.</span>
            </div>
            <Link href={getTextbookUrl()}
              className="mt-5 block rounded-xl bg-blue-600 p-4 text-center font-bold text-white shadow-sm hover:bg-blue-500 transition">
              Start {textbookCount}-MCQ Textbook Practice
            </Link>
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
                  className="block rounded-xl border bg-white p-4 shadow-sm hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{date}</p>
                      <p className="text-sm text-gray-500">{Object.values(test.answers).filter(Boolean).length} / {test.questions.length} answered</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
