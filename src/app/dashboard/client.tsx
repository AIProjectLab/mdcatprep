"use client";

/* These effects hydrate client-only localStorage state after server rendering. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllTests, isFreeTestUsed, isDailyChallengeUsedToday, type StoredTest } from "@/lib/store";
import type { Subject } from "@/lib/questions";
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
  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    setTests(getAllTests().filter((t) => t.submitted));
    setFreeUsed(isFreeTestUsed());
    setDailyAvailable(!isFreeTestUsed() || !isDailyChallengeUsedToday());
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
                <p className="mt-1 text-sm text-gray-600">Try 10 fresh MDCAT-style questions each day. Come back tomorrow for a new challenge.</p>
                {dailyAvailable ? (
                  <Link href="/test?mode=daily" className="mt-4 block rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
                    Start Today&apos;s Challenge
                  </Link>
                ) : (
                  <p className="mt-4 text-center text-sm font-semibold text-blue-700">Today&apos;s challenge completed ✓</p>
                )}
              </div>
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
