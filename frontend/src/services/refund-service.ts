import { prisma } from "@/lib/prisma";
import {
  evaluateRefundPolicy,
  HUMAN_REVIEW_THRESHOLD,
} from "@/services/policy-engine";
import { analyzeRefundRequest } from "@/services/ai-service";

export interface CreateRefundRequestInput {
  customerEmail: string;
  orderNumber: string;
  amount: number;
  reason: string;
}

export async function createRefundRequest(
  input: CreateRefundRequestInput
) {
  const customer = await prisma.customer.findUnique({
    where: {
      email: input.customerEmail,
    },
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const order = await prisma.order.findUnique({
    where: {
      orderNumber: input.orderNumber,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.customerId !== customer.id) {
    throw new Error(
      "The order does not belong to this customer."
    );
  }

  const ageInDays = Math.floor(
    (Date.now() - order.orderedAt.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // The deterministic policy engine is authoritative.
  const policyResult = evaluateRefundPolicy({
    order,
    requestedAmount: input.amount,
    reason: input.reason,
  });

  // AI is advisory only.
  const aiResult = await analyzeRefundRequest({
    customerName: customer.name,
    orderNumber: order.orderNumber,
    productName: order.items[0]?.productName ?? "Unknown product",
    orderAmount: order.totalAmount,
    requestedAmount: input.amount,
    orderAgeDays: ageInDays,
    reason: input.reason,
  });

  let finalDecision = policyResult.decision;
  const finalReasons = [...policyResult.reasons];

  // AI can only escalate a request.
  // It can NEVER override a deterministic denial.
  if (
    aiResult.classification === "SUSPICIOUS" ||
    aiResult.classification === "CONFLICTING"
  ) {
    if (finalDecision === "APPROVED") {
      finalDecision = "ESCALATED";
    }

    finalReasons.push(
      `AI classified the request as ${aiResult.classification.toLowerCase()}.`
    );
  }

  // Explicit high-value safeguard.
  if (
    input.amount > HUMAN_REVIEW_THRESHOLD &&
    finalDecision === "APPROVED"
  ) {
    finalDecision = "ESCALATED";

    finalReasons.push(
      `Refunds above $${HUMAN_REVIEW_THRESHOLD} require human review.`
    );
  }

  const refundRequest = await prisma.refundRequest.create({
    data: {
      customerId: customer.id,
      orderId: order.id,
      reason: input.reason,
      amount: input.amount,
      decision: finalDecision,
      aiClassification: aiResult.classification,
      aiConfidence: aiResult.confidence,
      policyReasons: finalReasons,
      response: aiResult.customerResponse,
    },
  });

  await prisma.auditLog.create({
    data: {
      refundId: refundRequest.id,
      event: "REFUND_DECISION",
      details: {
        finalDecision,
        policyDecision: policyResult.decision,
        policyReasons: policyResult.reasons,
        aiClassification: aiResult.classification,
        aiConfidence: aiResult.confidence,
      },
    },
  });

  return {
    id: refundRequest.id,
    decision: finalDecision,
    response: aiResult.customerResponse,
    reasons: finalReasons,
    ai: {
      classification: aiResult.classification,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
    },
  };
}