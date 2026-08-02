"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function PaymentPageClient({ userId, email }: { userId: string; email: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [txId, setTxId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Check if user already has access (from metadata)
  const hasAccess = user?.publicMetadata?.hasAccess === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim()) {
      setError("Please enter the name used for the Easypaisa payment");
      return;
    }
    if (!txId.trim()) {
      setError("Please enter the Easypaisa transaction ID");
      return;
    }
    setError("");
    // Send verification request to admin
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, transactionId: txId.trim(), payerName: payerName.trim() }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError("Failed to submit. Please try again or contact support.");
    }
  };

  if (hasAccess) {
    router.push("/dashboard");
    return null;
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <header className="fixed right-4 top-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">← Dashboard</Link>
          <UserButton />
        </header>
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold">Payment Submitted!</h1>
          <p className="mt-4 text-gray-600">
            We have received your payment request. Our team will verify it within a few hours.
            You will get access once confirmed. Check back on your dashboard.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <header className="fixed right-4 top-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-600">← Dashboard</Link>
        <UserButton />
      </header>
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center">Get MDCAT Pro Access</h1>
        <p className="mt-2 text-center text-gray-600">One-time payment of PKR 1,000</p>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-gray-900">What you get with Pro</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>✓ Unlimited 180-MCQ full exam simulations</li>
            <li>✓ 90-MCQ half tests and 30-MCQ quick practice</li>
            <li>✓ Subject-focused practice for all MDCAT subjects</li>
            <li>✓ Score history and subject-wise performance review</li>
            <li>✓ Private WhatsApp preparation and doubt-solving group</li>
          </ul>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Step 1: Send PKR 1,000 via Easypaisa</h2>
          <div className="mt-3 rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">Send to Easypaisa Number</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tracking-wider">{process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03XX-XXXXXXX"}</p>
            <p className="mt-1 text-xs text-gray-500">{process.env.NEXT_PUBLIC_EASYPAISA_NAME || "Your Name"}</p>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Open Easypaisa → Send Money → Enter this number → PKR 1,000 → Your PIN → Done
          </p>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Step 2: Enter Transaction ID</h2>
          <p className="mt-1 text-xs text-gray-500">
            After sending, you will receive an SMS with a Transaction ID. Enter it below.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name used for payment</label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Enter the Easypaisa account holder name"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Enter your Easypaisa transaction ID"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition"
            >
              Submit for Verification
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Having issues? Contact us on WhatsApp:{" "}
          <a href="https://wa.me/923159319433" target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline">
            03159319433
          </a>
        </p>

        <p className="mt-6 text-center text-sm text-gray-500">
          Not ready yet?{" "}
          <Link href="/dashboard" className="font-semibold text-emerald-700 underline hover:text-emerald-600">
            Back to free practice
          </Link>{" "}
          — your diagnostic, daily challenge and custom papers are still free.
        </p>
      </div>
    </main>
  );
}
