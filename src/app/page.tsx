import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          MDCAT <span className="text-emerald-600">Prep</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Start with a free 30-question MDCAT diagnostic, find your weak subject, and practice with authentic past-paper questions.
        </p>

        <div className="mt-10 rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Start free</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Take a 30-question MDCAT diagnostic</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Get your score and subject breakdown instantly. No payment required.</p>
          <SignedOut>
            <Link href="/sign-up" className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition">Start Free Diagnostic</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition">Start Free Diagnostic</Link>
          </SignedIn>
        </div>
        {/* Pricing is introduced after the user sees their diagnostic result. */}
        {/*
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-left">
            <h3 className="text-lg font-bold text-gray-900">Free</h3>
            <p className="mt-1 text-sm text-gray-500">Try before you buy</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> 1 full-length mock test (180 MCQs)</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> 3-hour timed simulation</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Instant score + subject breakdown</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Answer review</li>
            </ul>
            <SignedOut>
              <Link href="/sign-up" className="mt-4 block w-full rounded-lg border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                Try Free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="mt-4 block w-full rounded-lg border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                Try Free
              </Link>
            </SignedIn>
          </div>
          <div className="rounded-xl border border-emerald-600 bg-emerald-50 p-6 shadow-sm text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Pro</h3>
              <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">PKR 1,000</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">One-time payment. Unlimited access.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Unlimited full-length mock tests</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> 1,200+ real past paper MCQs</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Performance analytics</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> WhatsApp VIP doubt-solving group</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Solved past papers PDF download</li>
            </ul>
            <SignedOut>
              <Link href="/sign-up" className="mt-4 block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-emerald-500 transition">
                Get Started — PKR 1,000
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="mt-4 block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-emerald-500 transition">
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div> */}

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Real Past Papers</h3>
            <p className="mt-2 text-sm text-gray-600">MCQs from UHS, KMU, SIBA, SZABMU & DUHS 2017-2025</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">180 MCQs | 3 Hours</h3>
            <p className="mt-2 text-sm text-gray-600">Full exam simulation with auto-submit timer</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Instant Analytics</h3>
            <p className="mt-2 text-sm text-gray-600">Subject-wise breakdown: Bio, Chem, Physics, English, LR</p>
          </div>
        </div>
      </div>
    </main>
  );
}
