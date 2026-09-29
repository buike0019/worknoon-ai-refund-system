"use client";

import { useEffect, useState } from "react";

type Refund = {
  id: string;
  amount: number;
  reason: string;
  decision: "APPROVED" | "DENIED" | "ESCALATED" | null;
  aiClassification: string | null;
  aiConfidence: number | null;
  policyReasons: string[] | null;
  response: string | null;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  order: {
    orderNumber: string;
    totalAmount: number;
    status: string;
    items: {
      productName: string;
      quantity: number;
      finalSale: boolean;
    }[];
  };
  auditLogs: {
    id: string;
    event: string;
    details: Record<string, unknown> | null;
    createdAt: string;
  }[];
};

type ApiResponse = {
  refunds: Refund[];
  total: number;
};

export default function AdminPage() {
  const [data, setData] = useState<ApiResponse>({
    refunds: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function loadRefunds() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/refunds", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load refund requests.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load refund requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefunds();
  }, []);

  const approved = data.refunds.filter(
    (refund) => refund.decision === "APPROVED"
  ).length;

  const denied = data.refunds.filter(
    (refund) => refund.decision === "DENIED"
  ).length;

  const escalated = data.refunds.filter(
    (refund) => refund.decision === "ESCALATED"
  ).length;

  function decisionClass(decision: Refund["decision"]) {
    if (decision === "APPROVED") {
      return "text-emerald-400";
    }

    if (decision === "DENIED") {
      return "text-red-400";
    }

    if (decision === "ESCALATED") {
      return "text-amber-400";
    }

    return "text-slate-400";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              WORKNOON ADMIN
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Refund Operations
            </h1>

            <p className="mt-2 text-slate-400">
              Monitor refund decisions, AI classifications and audit activity.
            </p>
          </div>

          <button
            onClick={loadRefunds}
            className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Total requests" value={data.total} />
          <StatCard label="Approved" value={approved} />
          <StatCard label="Denied" value={denied} />
          <StatCard label="Escalated" value={escalated} />
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Recent refund requests</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review customer requests and automated decision evidence.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading refund requests...
            </div>
          ) : data.refunds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
              No refund requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`text-sm font-bold ${decisionClass(
                            refund.decision
                          )}`}
                        >
                          {refund.decision ?? "PENDING"}
                        </span>

                        <span className="text-sm text-slate-500">
                          {refund.order.orderNumber}
                        </span>

                        <span className="text-sm text-slate-500">
                          ${refund.amount.toFixed(2)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-semibold">
                        {refund.customer.name}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {refund.customer.email}
                      </p>

                      <p className="mt-3 text-sm text-slate-300">
                        {refund.reason}
                      </p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        AI classification
                      </p>

                      <p className="mt-1 font-semibold">
                        {refund.aiClassification ?? "N/A"}
                      </p>

                      {refund.aiClassification !== "UNAVAILABLE" &&
                        refund.aiConfidence !== null && (
                          <p className="text-sm text-slate-400">
                            {(refund.aiConfidence * 100).toFixed(0)}% confidence
                          </p>
                        )}

                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(refund.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setExpanded(
                        expanded === refund.id ? null : refund.id
                      )
                    }
                    className="mt-5 text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    {expanded === refund.id
                      ? "Hide details"
                      : "View decision details"}
                  </button>

                  {expanded === refund.id && (
                    <div className="mt-5 grid gap-5 border-t border-slate-800 pt-5 lg:grid-cols-2">
                      <div>
                        <h4 className="mb-2 font-semibold">
                          Policy reasons
                        </h4>

                        <div className="space-y-2">
                          {refund.policyReasons?.map((reason, index) => (
                            <div
                              key={index}
                              className="rounded-lg bg-slate-900 p-3 text-sm text-slate-300"
                            >
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 font-semibold">
                          Support response
                        </h4>

                        <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-300">
                          {refund.response || "No response recorded."}
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <h4 className="mb-2 font-semibold">
                          Audit log
                        </h4>

                        <div className="space-y-2">
                          {refund.auditLogs.map((log) => (
                            <div
                              key={log.id}
                              className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-medium">
                                  {log.event}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {formatDate(log.createdAt)}
                                </span>
                              </div>

                              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-400">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}