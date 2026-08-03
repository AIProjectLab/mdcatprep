import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

// MDCAT 2026 is on Sunday, 16 August 2026 (per the official PMDC public notice)
const MDCAT_DATE = new Date("2026-08-16T00:00:00");

function getDaysLeft(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = MDCAT_DATE.getTime() - today.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

const steps = [
  {
    n: "1",
    title: "Find your weak subject",
    desc: "Free 30-MCQ diagnostic built from the real 2025 papers. See your score and which subject needs the most work.",
  },
  {
    n: "2",
    title: "Practice it daily",
    desc: "30 fresh MCQs every day, focused on the areas you're falling behind in.",
  },
  {
    n: "3",
    title: "Sit the real exam",
    desc: "180-MCQ exam built from the actual 2025 papers — all 5 boards.",
  },
  {
    n: "4",
    title: "Watch your score rise",
    desc: "Every attempt is saved so you can track your improvement.",
  },
];

export default function Home() {
  const days = getDaysLeft();

  return (
    <main className="flex min-h-screen flex-col">
      {/* Minimal homepage header */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#faf6ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="text-lg font-bold text-stone-900">
              MDCAT <span className="text-teal-700">Prep</span>
            </span>
          </Link>
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-semibold text-stone-600 hover:text-stone-900 transition">
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600">
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-3xl">
        <p className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-800">
          ⏳ MDCAT in {days} {days === 1 ? "day" : "days"}
        </p>

        <h1 className="mt-5 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          You&apos;re in the right place.
        </h1>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          Find your weak subject with a free diagnostic built from the real 2025 papers.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Then practice full 180-MCQ exams built from real 2025 papers of all 5 boards.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <SignedOut>
            <Link
              href="/sign-up"
              className="inline-block rounded-xl bg-teal-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600"
            >
              Start the Free Diagnostic
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-teal-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600"
            >
              Start the Free Diagnostic
            </Link>
          </SignedIn>
        </div>

        {/* Hero visual — the real exam structure */}
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">The Real MDCAT 2025 Exam</p>
          <p className="mt-1 text-sm text-stone-500">180 MCQs · 3 hours · all 5 boards</p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Biology", count: 81, color: "bg-teal-600" },
              { name: "Chemistry", count: 45, color: "bg-teal-500" },
              { name: "Physics", count: 36, color: "bg-teal-400" },
              { name: "English", count: 9, color: "bg-amber-500" },
              { name: "Logical Reasoning", count: 9, color: "bg-amber-400" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-stone-600">{s.name}</span>
                <div className="h-2.5 flex-1 rounded-full bg-stone-100">
                  <div className={`h-2.5 rounded-full ${s.color}`} style={{ width: (s.count / 81) * 100 + "%" }} />
                </div>
                <span className="w-10 text-right text-stone-500">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* The 4-step path */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-stone-900">Here&apos;s exactly what to do</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-3 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-14 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="text-sm text-teal-800">
            <strong>2,000+ real past-paper questions</strong> · all 5 boards of 2025
            (UHS, KMU, SIBA, SZABMU, BUMHS) · 100% real exam questions
          </p>
        </div>
      </div>
      </div>
    </main>
  );
}
