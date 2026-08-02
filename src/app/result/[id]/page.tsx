"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { getTest } from "@/lib/store";
import questionsData from "@/data/questions.json";
import QuestionDisplay from "@/components/QuestionDisplay";
import AppHeader from "@/components/AppHeader";
import type { Question } from "@/lib/questions";

interface RawQuestion {
  id: number;
  subject: string;
  year: number;
  source: string;
  text: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const test = getTest(id);

  const result = useMemo(() => {
    if (!test) return null;
    const allQ = questionsData as RawQuestion[];
    const questions = allQ.filter((q) => test.questions.includes(q.id));
    let correct = 0;
    const subjectScores: Record<string, { correct: number; total: number }> = {};

    for (const q of questions) {
      const subj = q.subject;
      if (!subjectScores[subj]) subjectScores[subj] = { correct: 0, total: 0 };
      subjectScores[subj].total++;
      if (test.answers[q.id] === q.answer) {
        subjectScores[subj].correct++;
        correct++;
      }
    }

    return { questions, answers: test.answers, correct, total: questions.length, subjectScores };
  }, [test]);

  if (!test || !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500">Test not found. Start a new test from the dashboard.</p>
        <Link href="/dashboard" className="text-emerald-600 underline">Go to Dashboard</Link>
      </div>
    );
  }

  const percentage = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const passing = percentage >= 55;

  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${passing ? "bg-emerald-100" : "bg-red-100"}`}>
          <span className={`text-3xl font-bold ${passing ? "text-emerald-600" : "text-red-600"}`}>{percentage}%</span>
        </div>
        <h1 className={`text-2xl font-bold ${passing ? "text-emerald-700" : "text-red-700"}`}>
          {passing ? "Passing Score" : "Needs Improvement"}
        </h1>
        <p className="mt-2 text-gray-500">{result.correct} / {result.total} correct</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(result.subjectScores).map(([subject, score]) => {
          const subPct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
          return (
            <div key={subject} className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">{subject}</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">{subPct}%</p>
              <p className="text-sm text-gray-500">{score.correct}/{score.total} correct</p>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div className={`h-2 rounded-full ${subPct >= 55 ? "bg-emerald-500" : subPct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: subPct + "%" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold">Review All Questions</h2>
        {result.questions.map((q: RawQuestion, i: number) => (
          <div key={q.id} className="rounded-xl border bg-white p-6 shadow-sm">
            <span className="text-sm text-gray-500">Q{i + 1}</span>
            <QuestionDisplay question={q as unknown as Question} selected={result.answers[q.id]} onSelect={() => {}} showResult />
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-bold text-gray-900">Want more practice like this?</h2>
          <p className="mt-1 text-sm text-gray-600">
            {percentage >= 55
              ? "Great result! Keep the momentum with unlimited full-length MDCAT exams and focused subject practice."
              : "Every practice session helps. Unlock unlimited exams and focus on your weakest subjects."}
          </p>
          <Link href="/payment" className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            Unlock unlimited practice
          </Link>
          <p className="mt-3 text-xs text-gray-500">
            Also free: <Link href="/test?mode=daily" className="font-semibold text-blue-600 underline">today&apos;s 30-question challenge</Link>
          </p>
        </div>
        <Link href="/dashboard" className="inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
          Back to Dashboard
        </Link>
      </div>
      </div>
    </main>
  );
}
