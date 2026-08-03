"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useUser } from "@clerk/nextjs";
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
      <main className="min-h-screen">
        <AppHeader />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-8 w-8 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold">Payment Submitted!</h1>
          <p className="mt-4 text-stone-600">
            We have received your payment request. Our team will verify it within a few hours.
            You will get access once confirmed. Check back on your dashboard.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-600">
            Back to Dashboard
          </Link>
        </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center">Get MDCAT Pro Access</h1>
        <p className="mt-2 text-center text-stone-600">One-time payment of PKR 1,000</p>

        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
          <h2 className="font-semibold text-stone-900">What you get with Pro</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li>✓ Unlimited 180-MCQ full exam simulations</li>
            <li>✓ 90-MCQ half tests and 30-MCQ quick practice</li>
            <li>✓ Subject-focused practice for all MDCAT subjects</li>
            <li>✓ Score history and subject-wise performance review</li>
            <li>✓ Private WhatsApp preparation and doubt-solving group</li>
          </ul>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900">Step 1: Send PKR 1,000 via Easypaisa</h2>
          <div className="mt-3 rounded-lg bg-stone-50 p-4 text-center">
            <p className="text-sm text-stone-500">Send to Easypaisa Number</p>
            <p className="mt-1 text-2xl font-bold text-stone-900 tracking-wider">{process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || "03XX-XXXXXXX"}</p>
            <p className="mt-1 text-xs text-stone-500">{process.env.NEXT_PUBLIC_EASYPAISA_NAME || "Your Name"}</p>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Open Easypaisa → Send Money → Enter this number → PKR 1,000 → Your PIN → Done
          </p>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900">Step 2: Enter Transaction ID</h2>
          <p className="mt-1 text-xs text-stone-500">
            After sending, you will receive an SMS with a Transaction ID. Enter it below.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Name used for payment</label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Enter the Easypaisa account holder name"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Transaction ID</label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Enter your Easypaisa transaction ID"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-600 transition"
            >
              Submit for Verification
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Having issues? Contact us on WhatsApp:{" "}
          <a href="https://wa.me/923159319433" target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
            03159319433
          </a>
        </p>

        <p className="mt-6 text-center text-sm text-stone-500">
          Not ready yet?{" "}
          <Link href="/dashboard" className="font-semibold text-teal-700 underline hover:text-teal-700">
            Back to free practice
          </Link>{" "}
          — your diagnostic, daily challenge and custom papers are still free.
        </p>
      </div>
      </div>
    </main>
  );
}
