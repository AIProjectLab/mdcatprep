"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface PaymentRequest {
  id: string;
  email: string;
  transactionId: string;
  date: string;
}

// In production, fetch from a database. For MVP, we list users from Clerk API.
export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [error, setError] = useState("");

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    if (!isLoaded) return;
    if (!user || !isAdmin) return;
    // Fetch pending payments from the server
    fetch("/api/admin/pending-payments")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load payment requests.");
        setRequests(data.requests || []);
      })
      .catch((err: Error) => setError(err.message));
  }, [isLoaded, user, isAdmin]);

  const handleVerify = async (userId: string) => {
    const res = await fetch("/api/admin/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    }
  };

  if (!isLoaded) return null;

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Admin access required</h1>
        <p className="mt-3 text-gray-600">
          In Clerk, set your account&apos;s Public metadata to exactly:
        </p>
        <pre className="mt-4 rounded-lg bg-gray-100 p-4 text-left text-sm">{`{\n  "role": "admin"\n}`}</pre>
        <p className="mt-4 text-sm text-gray-500">
          Then sign out and sign back in so the updated metadata reaches this app.
          Current role: {String(user?.publicMetadata?.role ?? "not set")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin — Payment Verification</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {requests.length === 0 ? (
        <p className="mt-8 text-gray-500">No pending payment requests.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-medium">{req.email}</p>
              <p className="text-sm text-gray-500">Transaction: {req.transactionId}</p>
              <p className="text-sm text-gray-500">Date: {new Date(req.date).toLocaleString()}</p>
              <button
                onClick={() => handleVerify(req.id)}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
              >
                Verify & Grant Access
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
