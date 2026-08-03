import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

const features = [
  {
    title: "Real Past Papers",
    desc: "MCQs from UHS, KMU, SIBA, SZABMU & DUHS 2017-2025",
    icon: (
      <svg className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "180 MCQs | 3 Hours",
    desc: "Full exam simulation with auto-submit timer",
    icon: (
      <svg className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Instant Analytics",
    desc: "Subject-wise breakdown: Bio, Chem, Physics, English, LR",
    icon: (
      <svg className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const steps = [
  { n: "1", title: "Take the diagnostic", desc: "30 free questions. See your score instantly." },
  { n: "2", title: "Find your weak spot", desc: "We tell you which subject needs the most work." },
  { n: "3", title: "Practice full exams", desc: "Unlimited 180-MCQ tests with real past paper questions." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
          MDCAT <span className="text-teal-700">Prep</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-600">
          Start with a free 30-question MDCAT diagnostic, find your weak subject, and practice with authentic past-paper questions.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <SignedOut>
            <Link href="/sign-up" className="inline-block rounded-xl bg-teal-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600">
              Start Free Diagnostic
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="inline-block rounded-xl bg-teal-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-600">
              Start Free Diagnostic
            </Link>
          </SignedIn>
        </div>

        {/* Hero visual — mock score card */}
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your diagnostic result</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-teal-700">
              18<span className="text-sm font-medium text-teal-500">/30</span>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Nice work!</p>
              <p className="text-sm text-stone-500">60% · Focus on Chemistry next</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { name: "Biology", pct: 70, color: "bg-teal-500" },
              { name: "Chemistry", pct: 43, color: "bg-amber-500" },
              { name: "Physics", pct: 66, color: "bg-teal-400" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-stone-600">{s.name}</span>
                <div className="h-2 flex-1 rounded-full bg-stone-100">
                  <div className={`h-2 rounded-full ${s.color}`} style={{ width: s.pct + "%" }} />
                </div>
                <span className="w-10 text-right text-stone-500">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50">{f.icon}</div>
              <h3 className="mt-4 font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-stone-900">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-3 font-semibold text-stone-900">{s.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
