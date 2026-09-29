import { Order, OrderItem } from "@/generated/prisma/client";

export const REFUND_WINDOW_DAYS = 30;
export const HUMAN_REVIEW_THRESHOLD = 500;

export type PolicyDecision = "APPROVED" | "DENIED" | "ESCALATED";

export interface PolicyInput {
  order: Order & {
    items: OrderItem[];
  };
  requestedAmount: number;
  reason: string;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reasons: string[];
  eligible: boolean;
}

export function evaluateRefundPolicy(
  input: PolicyInput
): PolicyResult {
  const { order, requestedAmount, reason } = input;

  const reasons: string[] = [];

  const ageInDays = Math.floor(
    (Date.now() - order.orderedAt.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Rule 1: Already refunded orders cannot be refunded again.
  if (order.status === "REFUNDED") {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: ["This order has already been refunded."],
    };
  }

  // Rule 2: Cancelled orders cannot receive a refund through this flow.
  if (order.status === "CANCELLED") {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: ["This order is cancelled."],
    };
  }

  // Rule 3: Refund request must be within 30 days.
  if (ageInDays > REFUND_WINDOW_DAYS) {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: [
        `The order is ${ageInDays} days old and exceeds the ${REFUND_WINDOW_DAYS}-day refund window.`,
      ],
    };
  }

  // Rule 4: Final-sale items cannot be refunded.
  const containsFinalSaleItem = order.items.some(
    (item) => item.finalSale
  );

  if (containsFinalSaleItem) {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: ["The requested item is marked as final sale."],
    };
  }

  // Rule 5: Requested amount must not exceed the order total.
  if (requestedAmount > order.totalAmount) {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: [
        "The requested refund amount exceeds the order total.",
      ],
    };
  }

  if (requestedAmount <= 0) {
    return {
      decision: "DENIED",
      eligible: false,
      reasons: ["The refund amount must be greater than zero."],
    };
  }

  // Rule 6: High-value refunds require human review.
  if (requestedAmount > HUMAN_REVIEW_THRESHOLD) {
    reasons.push(
      `Refunds above $${HUMAN_REVIEW_THRESHOLD} require human review.`
    );
  }

  // Rule 7: Detect potentially conflicting/suspicious requests.
  const suspiciousPatterns = [
    /ignore.*polic/i,
    /bypass.*polic/i,
    /override.*polic/i,
    /administrator/i,
    /admin.*approve/i,
  ];

  const containsSuspiciousInstruction = suspiciousPatterns.some(
    (pattern) => pattern.test(reason)
  );

  if (containsSuspiciousInstruction) {
    reasons.push(
      "The request contains instructions attempting to influence or bypass the refund policy."
    );
  }

  // If any escalation condition exists, escalate.
  if (reasons.length > 0) {
    return {
      decision: "ESCALATED",
      eligible: true,
      reasons,
    };
  }

  return {
    decision: "APPROVED",
    eligible: true,
    reasons: [
      "The request satisfies the deterministic refund policy.",
    ],
  };
}