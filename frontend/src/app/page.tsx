"use client";

import { FormEvent, useState } from "react";

type RefundResult = {
  id: string;
  decision: "APPROVED" | "DENIED" | "ESCALATED";
  response: string;
  reasons: string[];
  ai: {
    classification: string;
    confidence: number;
    reasoning: string;
  };
};

export default function Home() {
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<RefundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail,
          orderNumber,
          amount: Number(amount),
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to process refund request.");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-400">
            WORKNOON SUPPORT
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Refund Support
          </h1>

          <p className="mt-2 text-slate-400">
            Submit a refund request and our support system will analyze
            your request against the refund policy.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Customer email
              </label>

              <input
                type="email"
                required
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="amina@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Order number
              </label>

              <input
                type="text"
                required
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="WN-1001"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Refund amount
              </label>

              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="129.99"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Reason for refund
              </label>

              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={5}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Tell us why you are requesting a refund..."
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing request..." : "Submit Refund Request"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-5 border-t border-slate-800 pt-6">
              <div>
                <p className="text-sm text-slate-400">Final decision</p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    result.decision === "APPROVED"
                      ? "text-green-400"
                      : result.decision === "DENIED"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {result.decision}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 p-4">
                <p className="mb-2 text-sm font-medium text-slate-400">
                  Support response
                </p>

                <p className="leading-7 text-slate-200">
                  {result.response}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-400">
                  Policy reasons
                </p>

                <ul className="space-y-2">
                  {result.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="rounded-lg bg-slate-950 p-3 text-sm text-slate-300"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="mb-3 text-sm font-medium text-slate-400">
                  AI analysis
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Classification
                    </p>
                    <p className="mt-1 font-medium">
                      {result.ai.classification}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Confidence
                    </p>
                    <p className="mt-1 font-medium">
                      {(result.ai.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {result.ai.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}